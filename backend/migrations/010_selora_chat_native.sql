-- ============================================================
-- 010 — Selora Native Store Chat & Agent Logs
-- Mirrors chat_messages and agent_logs tables but uses
-- selora_stores as the FK target (not stores).
-- Run this in the Supabase SQL editor.
-- ============================================================


-- ── Native chat messages ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS selora_chat_messages (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID    NOT NULL REFERENCES selora_stores(id) ON DELETE CASCADE,
  session_id TEXT    NOT NULL,
  role       TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT    NOT NULL,
  actions    JSONB   DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_selora_chat_messages_store_session
  ON selora_chat_messages(store_id, session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_selora_chat_messages_store_created
  ON selora_chat_messages(store_id, created_at DESC);

ALTER TABLE selora_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on selora_chat_messages"
  ON selora_chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);


-- ── Native agent logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS selora_agent_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID        NOT NULL REFERENCES selora_stores(id) ON DELETE CASCADE,
  action_type TEXT        NOT NULL,
  product_id  TEXT,
  reason      TEXT,
  data        JSONB       DEFAULT '{}'::jsonb,
  success     BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_selora_agent_logs_store_id
  ON selora_agent_logs(store_id, created_at DESC);

ALTER TABLE selora_agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on selora_agent_logs"
  ON selora_agent_logs FOR ALL
  USING (true)
  WITH CHECK (true);
