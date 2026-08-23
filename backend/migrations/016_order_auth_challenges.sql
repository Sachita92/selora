CREATE TABLE IF NOT EXISTS order_auth_challenges (
  nonce          TEXT        PRIMARY KEY,  -- random, unguessable
  wallet_address TEXT        NOT NULL,     -- the base58 wallet the challenge is bound to
  challenge      TEXT        NOT NULL,     -- exact message the buyer must sign
  expires_at     TIMESTAMPTZ NOT NULL,
  used_at        TIMESTAMPTZ               -- NULL until redeemed; single-use
);

-- Supports the opportunistic sweep in claim_order_challenge().
CREATE INDEX IF NOT EXISTS idx_order_auth_challenges_expires
  ON order_auth_challenges (expires_at);

ALTER TABLE order_auth_challenges ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION claim_order_challenge(p_nonce TEXT)
RETURNS TABLE(wallet_address TEXT, challenge TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE order_auth_challenges AS c
     SET used_at = now()
   WHERE c.nonce = p_nonce
     AND c.used_at IS NULL
     AND c.expires_at > now()
  RETURNING c.wallet_address, c.challenge;

  IF random() < 0.01 THEN
    DELETE FROM order_auth_challenges WHERE expires_at < now() - interval '1 hour';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION claim_order_challenge(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_order_challenge(TEXT) TO service_role;
