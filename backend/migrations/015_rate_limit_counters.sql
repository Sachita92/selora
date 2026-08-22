CREATE TABLE IF NOT EXISTS rate_limit_counters (
  key        TEXT        PRIMARY KEY,  -- "{scope}:{identity}:{window bucket}"
  count      INTEGER     NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Supports the opportunistic sweep in rate_limit_hit().
CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_expires
  ON rate_limit_counters (expires_at);

-- No policies: only the backend's service-role client (which bypasses RLS)
-- touches this table. Anon and authenticated see nothing.
ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION rate_limit_hit(p_key TEXT, p_window_seconds INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO rate_limit_counters AS c (key, count, expires_at)
  VALUES (p_key, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE
    SET count = c.count + 1
  RETURNING c.count INTO new_count;

  -- Opportunistic cleanup: ~1% of hits sweep expired rows (index-assisted),
  -- so the table cannot grow forever without needing pg_cron or an external
  -- scheduler — neither of which this deployment reliably has.
  IF random() < 0.01 THEN
    DELETE FROM rate_limit_counters WHERE expires_at < now();
  END IF;

  RETURN new_count;
END;
$$;

-- Only the backend may call the function; PostgREST exposes RPC to anon and
-- authenticated by default, which would let clients inflate counters.
REVOKE EXECUTE ON FUNCTION rate_limit_hit(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rate_limit_hit(TEXT, INTEGER) TO service_role;
