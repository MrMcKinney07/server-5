-- Campaign steps for drip sequences

CREATE TABLE IF NOT EXISTS campaign_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  delay_minutes int NOT NULL DEFAULT 0, -- Minutes after enrollment this step runs
  action_type text NOT NULL CHECK (action_type IN ('email', 'sms', 'task')),
  subject text, -- For email only
  body text NOT NULL, -- Message content or task description
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, step_number)
);

-- Index for efficient step queries
CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign_id ON campaign_steps(campaign_id);

-- Enable RLS
ALTER TABLE campaign_steps ENABLE ROW LEVEL SECURITY;

-- Agents can view all steps
CREATE POLICY "Agents can view campaign steps" ON campaign_steps
  FOR SELECT
  USING (true);

-- Only admins can manage steps
CREATE POLICY "Admins can manage campaign steps" ON campaign_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = auth.uid() 
      AND agents.role = 'admin'
    )
  );

COMMENT ON TABLE campaign_steps IS 'Individual steps within a drip campaign';
COMMENT ON COLUMN campaign_steps.delay_minutes IS 'Minutes after enrollment when this step should execute';
