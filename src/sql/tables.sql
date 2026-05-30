-- 1. Create businesses table with location support
CREATE TABLE businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS point type
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create reviews table
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create saved businesses (favorites)
CREATE TABLE saved_businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, business_id)
);

-- 4. Create a location search function (RPC)
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

-- 5. Add indexes for performance
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_location ON businesses USING GIST (location);
CREATE INDEX idx_reviews_business_id ON reviews(business_id);