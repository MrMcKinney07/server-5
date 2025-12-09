-- Mission Set Items Table
-- Links mission templates to mission sets

CREATE TABLE IF NOT EXISTS mission_set_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_set_id uuid NOT NULL REFERENCES mission_sets(id) ON DELETE CASCADE,
  mission_template_id uuid NOT NULL REFERENCES mission_templates(id) ON DELETE CASCADE,
  weight int DEFAULT 1,
  UNIQUE (mission_set_id, mission_template_id)
);

-- RLS Policies
ALTER TABLE mission_set_items ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to mission_set_items"
  ON mission_set_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = auth.uid()
      AND agents.role = 'admin'
    )
  );

-- Agents can read mission set items
CREATE POLICY "Agents can read mission_set_items"
  ON mission_set_items
  FOR SELECT
  TO authenticated
  USING (true);
