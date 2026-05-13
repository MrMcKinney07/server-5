-- Add sponsor and team relationships to agents table

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS sponsor_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_id UUID;

-- Create teams/pods table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  leader_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key to agents for team_id
ALTER TABLE agents
  ADD CONSTRAINT fk_agents_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- RLS for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Admins can manage teams
CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
  );

-- All authenticated can view teams
CREATE POLICY "Authenticated can view teams" ON teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create index
CREATE INDEX idx_agents_sponsor ON agents(sponsor_agent_id);
CREATE INDEX idx_agents_team ON agents(team_id);
