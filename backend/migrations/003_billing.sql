-- ============================================================
-- 003 — Billing
-- Stripe billing events log.
-- NOTE: The stripe columns on the users table (stripe_customer_id,
-- subscription_plan, etc.) are already included in 001_core_tables.sql.
-- This file only adds the billing_events log table.
-- Depends on: 001_core_tables.sql (users table)
-- ============================================================


CREATE TABLE IF NOT EXISTS billing_events (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID    REFERENCES users(id) ON DELETE CASCADE,
  event_type     TEXT    NOT NULL,   -- 'checkout_session_completed', 'invoice_paid', 'subscription_deleted'
  stripe_event_id TEXT,
  details        JSONB   DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Users can only view their own billing history
CREATE POLICY "Allow users to view own billing events"
  ON billing_events FOR SELECT
  USING (auth.uid() = user_id);
