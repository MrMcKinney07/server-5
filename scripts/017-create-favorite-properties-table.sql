-- Favorite properties for contacts (saved by agent on behalf of client)
CREATE TABLE IF NOT EXISTS favorite_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  saved_by_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, property_id)
);

-- Enable RLS
ALTER TABLE favorite_properties ENABLE ROW LEVEL SECURITY;

-- Agents can view favorites for contacts they own
CREATE POLICY "favorite_properties_select" ON favorite_properties
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = favorite_properties.contact_id 
      AND contacts.primary_agent_id = auth.uid()
    )
  );

CREATE POLICY "favorite_properties_insert" ON favorite_properties
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = favorite_properties.contact_id 
      AND contacts.primary_agent_id = auth.uid()
    )
  );

CREATE POLICY "favorite_properties_delete" ON favorite_properties
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = favorite_properties.contact_id 
      AND contacts.primary_agent_id = auth.uid()
    )
  );

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_favorite_properties_contact ON favorite_properties(contact_id);
CREATE INDEX IF NOT EXISTS idx_favorite_properties_property ON favorite_properties(property_id);
