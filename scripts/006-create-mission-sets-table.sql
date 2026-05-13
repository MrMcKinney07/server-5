-- Mission Sets Table
-- Groups of mission templates for assignment

CREATE TABLE IF NOT EXISTS mission_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment text NOT NULL CHECK (segment IN ('new', 'seasoned', 'custom')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE mission_sets ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to mission_sets"
  ON mission_sets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = auth.uid()
      AND agents.role = 'admin'
    )
  );

-- Agents can read mission sets
CREATE POLICY "Agents can read mission_sets"
  ON mission_sets
  FOR SELECT
  TO authenticated
  USING (true);
