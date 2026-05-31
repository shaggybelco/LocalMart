-- Enable RLS on all tables
ALTER TABLE businesses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_businesses ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified businesses
DROP POLICY IF EXISTS "public_read_verified_businesses" ON businesses;
CREATE POLICY "public_read_verified_businesses"
    ON businesses FOR SELECT USING (verified = true);

-- Anyone can read reviews
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews"
    ON reviews FOR SELECT USING (true);

-- Anyone can submit a review
DROP POLICY IF EXISTS "anyone_can_insert_review" ON reviews;
CREATE POLICY "anyone_can_insert_review"
    ON reviews FOR INSERT WITH CHECK (true);

-- Authenticated users can insert businesses
DROP POLICY IF EXISTS "auth_insert_businesses" ON businesses;
CREATE POLICY "auth_insert_businesses"
    ON businesses FOR INSERT TO authenticated WITH CHECK (true);

-- Owners can read their own businesses (even unverified)
DROP POLICY IF EXISTS "owners_read_own_businesses" ON businesses;
CREATE POLICY "owners_read_own_businesses"
    ON businesses FOR SELECT TO authenticated USING (owner_id = auth.uid());

-- Owners can update their own businesses
DROP POLICY IF EXISTS "auth_update_own_businesses" ON businesses;
CREATE POLICY "auth_update_own_businesses"
    ON businesses FOR UPDATE TO authenticated
    USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Users can only manage their own saved businesses
DROP POLICY IF EXISTS "users_own_saved" ON saved_businesses;
CREATE POLICY "users_own_saved"
    ON saved_businesses FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
