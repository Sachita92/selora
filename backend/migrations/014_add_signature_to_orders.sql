-- Migration to add signature column to selora_orders table
ALTER TABLE selora_orders ADD COLUMN IF NOT EXISTS signature TEXT;
