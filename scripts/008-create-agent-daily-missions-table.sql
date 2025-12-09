-- Agent Daily Missions Table
-- Tracks daily mission assignments per agent

CREATE TABLE IF NOT EXISTS agent_daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  date date NOT NULL,
  mission1_template_id uuid NOT NULL REFERENCES mission_templates(id),
  mission2_template_id uuid NOT NULL REFERENCES mission_templates(id),
  mission3_template_id uuid NOT NULL REFERENCES mission_templates(id),
  mission1_completed boolean DEFAULT false,
  mission2_completed boolean DEFAULT false,
  mission3_completed boolean DEFAULT false,
  released_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (agent_id, date)
);

-- RLS Policies
ALTER TABLE agent_daily_missions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to agent_daily_missions"
  ON agent_daily_missions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = auth.uid()
      AND agents.role = 'admin'
    )
  );

-- Agents can read their own missions
CREATE POLICY "Agents can read own missions"
  ON agent_daily_missions
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Agents can update their own mission completion status
CREATE POLICY "Agents can update own mission completion"
  ON agent_daily_missions
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());
