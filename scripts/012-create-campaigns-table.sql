-- Campaigns table for drip campaign engine

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_by_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for active campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Agents can view all campaigns
CREATE POLICY "Agents can view campaigns" ON campaigns
  FOR SELECT
  USING (true);

-- Only admins can create/update/delete campaigns
CREATE POLICY "Admins can manage campaigns" ON campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = auth.uid() 
      AND agents.role = 'admin'
    )
  );

COMMENT ON TABLE campaigns IS 'Drip campaigns for automated email/SMS sequences';
