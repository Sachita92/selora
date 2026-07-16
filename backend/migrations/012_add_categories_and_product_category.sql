-- Migration 012: Add dynamic categories JSONB column to selora_stores and category_id to selora_products

ALTER TABLE selora_stores ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb;

ALTER TABLE selora_products ADD COLUMN IF NOT EXISTS category_id TEXT;
