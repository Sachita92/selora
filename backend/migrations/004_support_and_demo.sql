-- ============================================================
-- 004 — Support & Demo Bookings
-- Public-facing forms: contact/support tickets and demo bookings.
-- No foreign keys to other tables — fully standalone.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. SUPPORT TICKETS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  store_url  TEXT,
  subject    TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  status     TEXT    DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────
-- 2. DEMO BOOKINGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demo_bookings (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name     TEXT    NOT NULL,
  last_name      TEXT    NOT NULL,
  email          TEXT    NOT NULL,
  store_url      TEXT,
  platform       TEXT    NOT NULL,
  monthly_revenue TEXT,
  timezone       TEXT    NOT NULL,
  message        TEXT,
  booking_date   DATE    NOT NULL,
  booking_time   TEXT    NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_bookings   ENABLE ROW LEVEL SECURITY;

-- Public insert (anyone can submit a support request or book a demo)
CREATE POLICY "Allow public insert for support"
  ON support_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert for demo"
  ON demo_bookings FOR INSERT
  WITH CHECK (true);

-- Authenticated users (admins) can view all records
CREATE POLICY "Allow all for authenticated users on support"
  ON support_tickets FOR ALL
  USING (true);

CREATE POLICY "Allow all for authenticated users on demo"
  ON demo_bookings FOR ALL
  USING (true);
