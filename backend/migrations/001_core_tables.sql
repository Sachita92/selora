-- ============================================================
-- 001 — Core Tables
-- Users, Connected Stores, Agent Logs, Growth Reports
-- Run this FIRST before any other migration.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. USERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                           TEXT        UNIQUE NOT NULL,

  -- Stripe billing
  stripe_customer_id              TEXT,
  stripe_subscription_id          TEXT,
  subscription_plan               TEXT        DEFAULT 'free' CHECK (subscription_plan IN ('free', 'growth', 'scale')),
  subscription_status             TEXT        DEFAULT 'active', -- 'active', 'trailing_grace_period', 'canceled', 'unpaid'
  subscription_current_period_end TIMESTAMPTZ,

  created_at                      TIMESTAMP   DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────
-- 2. STORES (connected e-commerce stores)
-- ────────────────────────────────────────────────────────────
CREATE TABLE stores (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        REFERENCES users(id) ON DELETE CASCADE,
  platform             TEXT        NOT NULL,          -- e.g. 'shopify'
  shop_url             TEXT        NOT NULL,
  access_token         TEXT        NOT NULL,
  shop_name            TEXT,
  is_active            BOOLEAN     DEFAULT TRUE,
  run_count_this_month INT         DEFAULT 0,         -- for plan limit enforcement
  settings             JSONB       DEFAULT '{}'::jsonb, -- per-store agent config (guardrails, schedule, etc.)
  created_at           TIMESTAMP   DEFAULT NOW(),
  last_synced_at       TIMESTAMP
);


-- ────────────────────────────────────────────────────────────
-- 3. AGENT LOGS (every action the AI takes)
-- ────────────────────────────────────────────────────────────
CREATE TABLE agent_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID        REFERENCES stores(id) ON DELETE CASCADE,
  action_type TEXT        NOT NULL,   -- 'reprice', 'optimize_listing', 'restock_alert', etc.
  product_id  TEXT,
  reason      TEXT,
  data        JSONB,
  success     BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMP   DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────
-- 4. REPORTS (daily AI growth reports)
-- ────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID        REFERENCES stores(id) ON DELETE CASCADE,
  summary       TEXT,
  wins          JSONB,
  concerns      JSONB,
  actions_taken JSONB,
  created_at    TIMESTAMP   DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports    ENABLE ROW LEVEL SECURITY;


-- users: can only read/update their own row
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);


-- stores: can only see/manage their own stores
CREATE POLICY "Users can view own stores"
  ON stores FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stores"
  ON stores FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores"
  ON stores FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stores"
  ON stores FOR DELETE USING (auth.uid() = user_id);


-- agent_logs: users can only see logs for their own stores
CREATE POLICY "Users can view own agent logs"
  ON agent_logs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = agent_logs.store_id
      AND stores.user_id = auth.uid()
    )
  );


-- reports: users can only see reports for their own stores
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = reports.store_id
      AND stores.user_id = auth.uid()
    )
  );
