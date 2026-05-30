-- Ensure updated_at column exists on businesses (remote table may predate this column)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
