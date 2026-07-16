-- Migration 011: Add hero image columns to selora_stores

ALTER TABLE selora_stores ADD COLUMN IF NOT EXISTS hero_image_main TEXT;
ALTER TABLE selora_stores ADD COLUMN IF NOT EXISTS hero_image_left TEXT;
ALTER TABLE selora_stores ADD COLUMN IF NOT EXISTS hero_image_right TEXT;
