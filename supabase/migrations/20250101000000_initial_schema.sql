-- supabase/migrations/20250101000000_initial_schema.sql

-- Enable PostGIS extension for location-based queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create businesses table
-- supabase/migrations/20250103000000_fix_existing_tables.sql

-- Create tables only if they don't exist
CREATE TABLE IF NOT EXISTS businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT,
    whatsapp_number VARCHAR(20),
    phone_number VARCHAR(20),
    open_time TIME,
    close_time TIME,
    inventory TEXT[] DEFAULT '{}',
    accepts_digital_payment BOOLEAN DEFAULT false,
    price_range VARCHAR(3) DEFAULT 'RR',
    rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    owner_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure updated_at column exists (for tables created before this migration)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST (location);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create saved businesses (favorites) table
CREATE TABLE IF NOT EXISTS saved_businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, business_id)
);

-- Create location search function
CREATE OR REPLACE FUNCTION nearby_businesses(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION,
    category_filter TEXT DEFAULT NULL
)
RETURNS SETOF businesses
LANGUAGE sql
STABLE
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_saved_businesses_user_id ON saved_businesses(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to businesses table
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();