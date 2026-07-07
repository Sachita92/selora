-- 1. Alter selora_stores to add merchant payout wallet address
ALTER TABLE selora_stores ADD COLUMN IF NOT EXISTS payout_wallet_address TEXT;

-- 2. Create native storefront orders table
CREATE TABLE IF NOT EXISTS selora_orders (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID          NOT NULL REFERENCES selora_stores(id) ON DELETE CASCADE,
  reference   TEXT          NOT NULL UNIQUE, -- Solana reference public key
  buyer_wallet TEXT,                          -- Buyer's public key (optional)
  total_usd   NUMERIC(10,2) NOT NULL,
  status      TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  items       JSONB         NOT NULL,        -- Array of cart items: {product_id, quantity, price, title}
  created_at  TIMESTAMPTZ   DEFAULT now(),
  updated_at  TIMESTAMPTZ   DEFAULT now()
);

-- Index for reference lookup in polling/verification
CREATE INDEX IF NOT EXISTS idx_selora_orders_reference ON selora_orders(reference);

-- Enable RLS
ALTER TABLE selora_orders ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies
-- Only the store owner can select/view orders for their store
CREATE POLICY "owner_select_orders" ON selora_orders
  FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT id FROM selora_stores WHERE user_id = auth.uid()
    )
  );