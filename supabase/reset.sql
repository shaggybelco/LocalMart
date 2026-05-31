-- Run this in Supabase Dashboard → SQL Editor
-- BEFORE running: go to Storage → business-images bucket → select all files → delete, then delete the bucket

-- Drop triggers first
DROP TRIGGER IF EXISTS trg_sync_business_rating ON reviews;
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;

-- Drop functions
DROP FUNCTION IF EXISTS sync_business_rating() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS nearby_businesses(float8, float8, float8, text) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_root_admin() CASCADE;

-- Drop tables (cascade removes foreign keys / policies automatically)
DROP TABLE IF EXISTS reviews            CASCADE;
DROP TABLE IF EXISTS saved_businesses   CASCADE;
DROP TABLE IF EXISTS admins             CASCADE;
DROP TABLE IF EXISTS businesses         CASCADE;

-- Clear Supabase migration history so it will re-run all files
DELETE FROM supabase_migrations.schema_migrations;

-- Confirm
SELECT 'Database reset complete. Now run: supabase db push' AS status;
