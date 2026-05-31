-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
    id                  UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    category            VARCHAR(50)  NOT NULL,
    location            GEOGRAPHY(POINT, 4326) NOT NULL,
    address             TEXT,
    whatsapp_number     VARCHAR(20),
    phone_number        VARCHAR(20),
    open_time           TIME,
    close_time          TIME,
    inventory           TEXT[]       DEFAULT '{}',
    accepts_digital_payment BOOLEAN  DEFAULT false,
    price_range         VARCHAR(3)   DEFAULT 'RR',
    rating              DECIMAL(2,1) DEFAULT 0,
    total_reviews       INTEGER      DEFAULT 0,
    verified            BOOLEAN      DEFAULT false,
    cover_image         TEXT,
    images              TEXT[]       DEFAULT '{}',
    deletion_requested  BOOLEAN      DEFAULT false,
    deletion_reason     TEXT,
    owner_id            UUID,
    created_at          TIMESTAMPTZ  DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION GENERATED ALWAYS AS (ST_X(location::geometry)) STORED;

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID    REFERENCES businesses(id) ON DELETE CASCADE,
    user_id     UUID,
    rating      INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Saved businesses
CREATE TABLE IF NOT EXISTS saved_businesses (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, business_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_location   ON businesses USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_businesses_category   ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id   ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_saved_businesses_user ON saved_businesses(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Nearby search (PostGIS)
CREATE OR REPLACE FUNCTION nearby_businesses(
    lat DOUBLE PRECISION, lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION, category_filter TEXT DEFAULT NULL
)
RETURNS SETOF businesses LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT * FROM businesses
    WHERE ST_DWithin(location::geography, ST_MakePoint(lng,lat)::geography, radius_meters)
      AND (category_filter IS NULL OR category = category_filter)
      AND verified = true
    ORDER BY location::geography <-> ST_MakePoint(lng,lat)::geography LIMIT 50;
$$;

-- Auto-recalculate rating after review insert/delete
CREATE OR REPLACE FUNCTION sync_business_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE businesses SET
        rating        = COALESCE((SELECT ROUND(AVG(rating)::numeric,1) FROM reviews WHERE business_id = COALESCE(NEW.business_id,OLD.business_id)),0),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE business_id = COALESCE(NEW.business_id,OLD.business_id))
    WHERE id = COALESCE(NEW.business_id,OLD.business_id);
    RETURN COALESCE(NEW,OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_business_rating ON reviews;
CREATE TRIGGER trg_sync_business_rating
    AFTER INSERT OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION sync_business_rating();
