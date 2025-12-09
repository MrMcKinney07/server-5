-- Campaign enrollments - tracks contacts enrolled in campaigns

CREATE TABLE IF NOT EXISTS campaign_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE, -- Who owns the relationship
  enrolled_at timestamptz DEFAULT now(),
  is_paused boolean DEFAULT false,
  completed_at timestamptz,
  last_step_executed int DEFAULT 0, -- Tracks progress through campaign
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, contact_id) -- Prevent duplicate enrollments
);

-- Indexes for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_campaign_id ON campaign_enrollments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_contact_id ON campaign_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_agent_id ON campaign_enrollments(agent_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_active ON campaign_enrollments(is_paused, completed_at) 
  WHERE is_paused = false AND completed_at IS NULL;

-- Enable RLS
ALTER TABLE campaign_enrollments ENABLE ROW LEVEL SECURITY;

-- Agents can view enrollments for their contacts or their own enrollments
CREATE POLICY "Agents can view relevant enrollments" ON campaign_enrollments
  FOR SELECT
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = campaign_enrollments.contact_id 
      AND contacts.primary_agent_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = auth.uid() 
      AND agents.role = 'admin'
    )
  );

-- Agents can create enrollments for contacts they own
CREATE POLICY "Agents can create enrollments" ON campaign_enrollments
  FOR INSERT
  WITH CHECK (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = auth.uid() 
      AND agents.role = 'admin'
    )
  );

-- Agents can update their own enrollments, admins can update all
CREATE POLICY "Agents can update enrollments" ON campaign_enrollments
  FOR UPDATE
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = auth.uid() 
      AND agents.role = 'admin'
    )
  );

-- Agents can delete their own enrollments, admins can delete all
CREATE POLICY "Agents can delete enrollments" ON campaign_enrollments
  FOR DELETE
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = auth.uid() 
      AND agents.role = 'admin'
    )
  );

COMMENT ON TABLE campaign_enrollments IS 'Tracks which contacts are enrolled in which campaigns';
COMMENT ON COLUMN campaign_enrollments.last_step_executed IS 'The step_number of the last executed step (0 = none executed yet)';
