-- Create lead_assign_state table for tracking round-robin lead assignment
CREATE TABLE IF NOT EXISTS lead_assign_state (
  id INT PRIMARY KEY DEFAULT 1,
  year INT NOT NULL,
  month INT NOT NULL,
  last_rank_assigned INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure only one row exists
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial row for current month
INSERT INTO lead_assign_state (id, year, month, last_rank_assigned)
VALUES (1, EXTRACT(YEAR FROM NOW())::INT, EXTRACT(MONTH FROM NOW())::INT, 0)
ON CONFLICT (id) DO NOTHING;

-- RLS policies
ALTER TABLE lead_assign_state ENABLE ROW LEVEL SECURITY;

-- Only admins can read/update
CREATE POLICY "Admins can view lead_assign_state"
  ON lead_assign_state
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid() AND agents.role = 'admin')
  );

CREATE POLICY "Admins can update lead_assign_state"
  ON lead_assign_state
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid() AND agents.role = 'admin')
  );

-- Service role can always access (for API routes)
CREATE POLICY "Service role full access to lead_assign_state"
  ON lead_assign_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
