-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    email          TEXT        NOT NULL UNIQUE,
    is_root        BOOLEAN     DEFAULT false,
    added_by_email TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Seed root admin
INSERT INTO admins (email, is_root)
VALUES ('shaggybelco1@gmail.com', true)
ON CONFLICT (email) DO NOTHING;

-- Helper functions (SECURITY DEFINER bypasses RLS to avoid circular dependency)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM admins WHERE email = auth.email());
$$;

CREATE OR REPLACE FUNCTION is_root_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM admins WHERE email = auth.email() AND is_root = true);
$$;

-- RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select" ON admins;
CREATE POLICY "admins_select" ON admins FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admins_insert" ON admins;
CREATE POLICY "admins_insert" ON admins FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admins_delete" ON admins;
CREATE POLICY "admins_delete" ON admins FOR DELETE TO authenticated
    USING (is_root = false AND is_admin());

-- Admins can read ALL businesses (including unverified)
DROP POLICY IF EXISTS "admins_read_all_businesses" ON businesses;
CREATE POLICY "admins_read_all_businesses"
    ON businesses FOR SELECT TO authenticated USING (is_admin());

-- Admins can update any business (verify, reject, etc.)
DROP POLICY IF EXISTS "admins_update_businesses" ON businesses;
CREATE POLICY "admins_update_businesses"
    ON businesses FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

-- Admins can delete any business
DROP POLICY IF EXISTS "admins_delete_businesses" ON businesses;
CREATE POLICY "admins_delete_businesses"
    ON businesses FOR DELETE TO authenticated USING (is_admin());

-- Enable realtime for live pending-count badge
ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
