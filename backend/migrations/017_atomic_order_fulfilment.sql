ALTER TABLE selora_orders DROP CONSTRAINT IF EXISTS selora_orders_status_check;
ALTER TABLE selora_orders ADD CONSTRAINT selora_orders_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'expired'));

-- 2. Surface oversell to the seller: which items sold beyond stock, and by how
--    much. NULL/absent for the normal (fully-covered) case.
ALTER TABLE selora_orders ADD COLUMN IF NOT EXISTS oversold_items JSONB;

CREATE OR REPLACE FUNCTION claim_and_fulfill_order(p_order_id UUID, p_signature TEXT)
RETURNS TABLE(claimed BOOLEAN, oversold JSONB)
LANGUAGE plpgsql
AS $$
DECLARE
  v_store_id UUID;
  v_items    JSONB;
  v_item     JSONB;
  v_pid      UUID;
  v_qty      INTEGER;
  v_before   INTEGER;
  v_oversold JSONB := '[]'::jsonb;
BEGIN
  -- Atomic claim. A concurrent verify finds status already 'paid', matches zero
  -- rows, and returns claimed=false so it re-runs none of the fulfilment work.
  UPDATE selora_orders
     SET status = 'paid', signature = p_signature
   WHERE id = p_order_id AND status = 'pending'
  RETURNING store_id, items INTO v_store_id, v_items;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '[]'::jsonb;
    RETURN;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_items, '[]'::jsonb))
  LOOP
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::int, 1);

    v_before := NULL;
    WITH before AS (
      SELECT inventory AS inv FROM selora_products WHERE id = v_pid FOR UPDATE
    )
    UPDATE selora_products p
       SET inventory = GREATEST(p.inventory - v_qty, 0)
      FROM before
     WHERE p.id = v_pid
    RETURNING before.inv INTO v_before;

    IF v_before IS NULL THEN
      CONTINUE;  -- product no longer exists; nothing to decrement
    END IF;

    IF v_before < v_qty THEN
      v_oversold := v_oversold || jsonb_build_object(
        'product_id', v_pid,
        'requested',  v_qty,
        'available',  v_before
      );
    END IF;

    INSERT INTO selora_events (store_id, product_id, event_type)
    VALUES (v_store_id, v_pid, 'purchase');
  END LOOP;

  IF jsonb_array_length(v_oversold) > 0 THEN
    UPDATE selora_orders SET oversold_items = v_oversold WHERE id = p_order_id;
  END IF;

  RETURN QUERY SELECT true, v_oversold;
END;
$$;

-- Only the backend's service-role client may call this; PostgREST exposes RPC
-- to anon and authenticated by default.
REVOKE EXECUTE ON FUNCTION claim_and_fulfill_order(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_and_fulfill_order(UUID, TEXT) TO service_role;
