ALTER TABLE selora_stores ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb;
