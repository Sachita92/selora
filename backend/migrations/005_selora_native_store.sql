-- ────────────────────────────────────────────────────────────
-- 1. STORES
-- ────────────────────────────────────────────────────────────
CREATE TABLE selora_stores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  handle        TEXT        NOT NULL UNIQUE,        -- URL slug, e.g. "luna-mode"
  description   TEXT,                               -- short tagline shown on storefront
  cover_image   TEXT,                               -- URL of the store banner image
  currency      TEXT        DEFAULT 'USD',
  is_public     BOOLEAN     DEFAULT true,           -- merchant opted in to be discoverable
  is_featured   BOOLEAN     DEFAULT false,          -- admin-curated featured stores
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index: look up a store by its owner
CREATE INDEX idx_selora_stores_user_id ON selora_stores(user_id);

-- Index: public storefront lookup by handle
CREATE INDEX idx_selora_stores_handle  ON selora_stores(handle);


-- ────────────────────────────────────────────────────────────
-- 2. PRODUCTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE selora_products (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID        NOT NULL REFERENCES selora_stores(id) ON DELETE CASCADE,
  title             TEXT        NOT NULL,
  description       TEXT,
  price             NUMERIC(10,2) NOT NULL,
  compare_at_price  NUMERIC(10,2),                  -- original price (shows discount badge)
  inventory         INT         DEFAULT 0,
  images            TEXT[],                          -- ordered array of public image URLs
  tags              TEXT[],                          -- e.g. ["summer", "dress", "floral"]
  is_active         BOOLEAN     DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Index: list products for a given store
CREATE INDEX idx_selora_products_store_id ON selora_products(store_id);


-- ────────────────────────────────────────────────────────────
-- 3. ANALYTICS EVENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE selora_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID        REFERENCES selora_stores(id)   ON DELETE CASCADE,
  product_id   UUID        REFERENCES selora_products(id) ON DELETE CASCADE,
  event_type   TEXT        NOT NULL CHECK (event_type IN ('view', 'add_to_cart', 'purchase')),
  session_id   TEXT,                                -- anonymous session identifier
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index: analytics queries are almost always scoped to a store + time range
CREATE INDEX idx_selora_events_store_id   ON selora_events(store_id);
CREATE INDEX idx_selora_events_product_id ON selora_events(product_id);
CREATE INDEX idx_selora_events_created_at ON selora_events(created_at);


-- ────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE selora_stores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE selora_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE selora_events   ENABLE ROW LEVEL SECURITY;


-- selora_stores policies

-- Any authenticated user can create their own store
CREATE POLICY "store_insert_own"
  ON selora_stores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owners can view their own store (even if not public)
CREATE POLICY "store_select_own"
  ON selora_stores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Public storefronts are readable by everyone (including anonymous visitors)
CREATE POLICY "store_select_public"
  ON selora_stores FOR SELECT
  TO anon
  USING (is_public = true);

-- Owners can update their own store
CREATE POLICY "store_update_own"
  ON selora_stores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owners can delete their own store
CREATE POLICY "store_delete_own"
  ON selora_stores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- selora_products policies

-- Owners can insert products into their own stores
CREATE POLICY "product_insert_own"
  ON selora_products FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT id FROM selora_stores WHERE user_id = auth.uid()
    )
  );

-- Owners can view all their products (including inactive)
CREATE POLICY "product_select_own"
  ON selora_products FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM selora_stores WHERE user_id = auth.uid()
    )
  );

-- Anonymous visitors can view active products in public stores
CREATE POLICY "product_select_public"
  ON selora_products FOR SELECT
  TO anon
  USING (
    is_active = true
    AND store_id IN (
      SELECT id FROM selora_stores WHERE is_public = true
    )
  );

-- Owners can update their own products
CREATE POLICY "product_update_own"
  ON selora_products FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM selora_stores WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM selora_stores WHERE user_id = auth.uid()
    )
  );

-- Owners can delete their own products
CREATE POLICY "product_delete_own"
  ON selora_products FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM selora_stores WHERE user_id = auth.uid()
    )
  );


-- selora_events policies

-- Anyone (including anonymous visitors) can insert events
CREATE POLICY "event_insert_anyone"
  ON selora_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Store owners can read their own analytics events
CREATE POLICY "event_select_own"
  ON selora_events FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM selora_stores WHERE user_id = auth.uid()
    )
  );


-- ────────────────────────────────────────────────────────────
-- 5. SUPABASE STORAGE BUCKET  (run separately if needed)
-- ────────────────────────────────────────────────────────────
-- If you prefer to create the bucket via the Supabase dashboard
-- (Storage -> New bucket -> "selora-products", Public = ON) you
-- can skip the two lines below.  Otherwise, uncomment them:

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('selora-products', 'selora-products', true)
-- ON CONFLICT (id) DO NOTHING;
