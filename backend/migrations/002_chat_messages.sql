-- ============================================================
-- 002 — Chat Messages
-- Stores the full AI conversation history per store session.
-- Depends on: 001_core_tables.sql (stores table)
-- ============================================================


CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID    NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  session_id TEXT    NOT NULL,
  role       TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT    NOT NULL,
  actions    JSONB   DEFAULT '[]'::jsonb,   -- tool calls the agent made in this turn
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Fast lookups by store + session (used when loading a conversation)
CREATE INDEX IF NOT EXISTS idx_chat_messages_store_session
  ON chat_messages(store_id, session_id, created_at);

-- Fast lookups for listing all sessions per store
CREATE INDEX IF NOT EXISTS idx_chat_messages_store_created
  ON chat_messages(store_id, created_at DESC);


-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
-- (store ownership is enforced at the API layer via the store_id check)
CREATE POLICY "Allow all for authenticated"
  ON chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);
