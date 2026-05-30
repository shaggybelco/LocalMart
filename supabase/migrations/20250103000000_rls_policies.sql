-- Enable RLS on all tables (safe to run if already enabled)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_businesses ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified businesses
DROP POLICY IF EXISTS "public_read_verified_businesses" ON businesses;
CREATE POLICY "public_read_verified_businesses"
  ON businesses FOR SELECT
  USING (verified = true);

-- Anyone can read reviews
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews"
  ON reviews FOR SELECT
  USING (true);

-- Recreate nearby_businesses with SECURITY DEFINER so it can read
-- businesses regardless of the caller's RLS context
CREATE OR REPLACE FUNCTION nearby_businesses(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION,
    category_filter TEXT DEFAULT NULL
)
RETURNS SETOF businesses
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT *
    FROM businesses
    WHERE
        ST_DWithin(
            location::geography,
            ST_MakePoint(lng, lat)::geography,
            radius_meters
        )
        AND (category_filter IS NULL OR category = category_filter)
        AND verified = true
    ORDER BY location::geography <-> ST_MakePoint(lng, lat)::geography
    LIMIT 50;
$$;
