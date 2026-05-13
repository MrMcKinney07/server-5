-- Properties table for IDX/MLS property data (mock or real)
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mls_id text UNIQUE,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL DEFAULT 'TX',
  zip text NOT NULL,
  price integer NOT NULL,
  beds integer NOT NULL DEFAULT 0,
  baths integer NOT NULL DEFAULT 0,
  sqft integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold')),
  thumbnail_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Properties are readable by all authenticated users (agents)
CREATE POLICY "properties_select_all" ON properties
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can insert/update/delete properties
CREATE POLICY "properties_admin_insert" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid() AND agents.role = 'admin')
  );

CREATE POLICY "properties_admin_update" ON properties
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid() AND agents.role = 'admin')
  );

CREATE POLICY "properties_admin_delete" ON properties
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid() AND agents.role = 'admin')
  );

-- Index for common search patterns
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
