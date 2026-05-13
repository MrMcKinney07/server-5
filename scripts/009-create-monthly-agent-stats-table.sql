-- Monthly Agent Stats Table
-- Aggregated monthly statistics for leaderboard

CREATE TABLE IF NOT EXISTS monthly_agent_stats (
  id bigserial PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  total_points int DEFAULT 0,
  rank int,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (agent_id, year, month)
);

-- RLS Policies
ALTER TABLE monthly_agent_stats ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to monthly_agent_stats"
  ON monthly_agent_stats
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = auth.uid()
      AND agents.role = 'admin'
    )
  );

-- Agents can read all stats (for leaderboard)
CREATE POLICY "Agents can read monthly_agent_stats"
  ON monthly_agent_stats
  FOR SELECT
  TO authenticated
  USING (true);
