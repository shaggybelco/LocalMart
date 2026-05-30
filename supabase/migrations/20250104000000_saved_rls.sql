-- Add generated latitude/longitude columns so SELECT * always includes coordinates.
-- These stay in sync with the PostGIS location column automatically.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION
    GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION
    GENERATED ALWAYS AS (ST_X(location::geometry)) STORED;

-- RLS for saved_businesses: users only see and manage their own saves
ALTER TABLE saved_businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_saved" ON saved_businesses;
CREATE POLICY "users_own_saved"
  ON saved_businesses
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Authenticated users can register their own businesses
DROP POLICY IF EXISTS "auth_insert_businesses" ON businesses;
CREATE POLICY "auth_insert_businesses"
  ON businesses
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
