-- Consolidated: demo user + admin rights + function search_path fixes
-- Replaces the 5 separate fix migrations

-- 1. Demo user (proper creation with auth.identities)
DO $$
DECLARE uid UUID := gen_random_uuid();
BEGIN
  DELETE FROM auth.users WHERE email = 'localMart@belco.co.za';
  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'localMart@belco.co.za',
    extensions.crypt('#Password1', extensions.gen_salt('bf')),
    NOW(), '{"provider":"email","providers":["email"]}', '{}',
    false, NOW(), NOW(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    'localMart@belco.co.za', uid,
    jsonb_build_object('sub', uid::text, 'email', 'localMart@belco.co.za', 'email_verified', true),
    'email', NOW(), NOW(), NOW()
  );
END;
$$;

-- 2. Grant demo user admin rights
INSERT INTO admins (email, is_root, added_by_email)
VALUES ('localMart@belco.co.za', false, 'shaggybelco1@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 3. Fix SECURITY DEFINER functions — explicit search_path prevents schema errors
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE email = auth.email());
$$;

CREATE OR REPLACE FUNCTION is_root_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE email = auth.email() AND is_root = true);
$$;

-- 4. Fix nearby_businesses — explicit RETURNS TABLE avoids PostgREST schema cache errors
DROP FUNCTION IF EXISTS nearby_businesses(float8, float8, float8, text);
CREATE OR REPLACE FUNCTION nearby_businesses(
    lat DOUBLE PRECISION, lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION, category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID, name VARCHAR, category VARCHAR, location GEOGRAPHY,
    address TEXT, whatsapp_number VARCHAR, phone_number VARCHAR,
    open_time TIME, close_time TIME, inventory TEXT[],
    accepts_digital_payment BOOLEAN, price_range VARCHAR,
    rating DECIMAL, total_reviews INTEGER, verified BOOLEAN,
    cover_image TEXT, images TEXT[], deletion_requested BOOLEAN,
    deletion_reason TEXT, owner_id UUID, created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, category, location, address, whatsapp_number, phone_number,
    open_time, close_time, inventory, accepts_digital_payment, price_range,
    rating, total_reviews, verified, cover_image, images, deletion_requested,
    deletion_reason, owner_id, created_at, updated_at, latitude, longitude
  FROM businesses
  WHERE ST_DWithin(location::geography, ST_MakePoint(lng,lat)::geography, radius_meters)
    AND (category_filter IS NULL OR category = category_filter)
    AND verified = true
  ORDER BY location::geography <-> ST_MakePoint(lng,lat)::geography LIMIT 50;
$$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
