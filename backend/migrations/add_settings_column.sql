ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Verify the column was added:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stores'
ORDER BY ordinal_position;
