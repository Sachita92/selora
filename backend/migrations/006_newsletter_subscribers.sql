-- ============================================================
-- 006 — Newsletter Subscribers
-- Stores email signups from the landing page newsletter form.
-- No foreign keys — fully standalone.
-- ============================================================


CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);


-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (public insert from landing page)
CREATE POLICY "Allow public insert for newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Only authenticated users (admins) can view subscribers
CREATE POLICY "Allow authenticated to view subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (auth.role() = 'authenticated');
