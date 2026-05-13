-- Mission Templates Table
-- Stores reusable mission definitions

CREATE TABLE IF NOT EXISTS mission_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  segment text NOT NULL CHECK (segment IN ('new', 'seasoned', 'all')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE mission_templates ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to mission_templates"
  ON mission_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = auth.uid()
      AND agents.role = 'admin'
    )
  );

-- Agents can read active templates
CREATE POLICY "Agents can read active mission_templates"
  ON mission_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);
