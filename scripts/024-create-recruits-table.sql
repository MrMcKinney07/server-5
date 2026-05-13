-- Recruiting pipeline - track prospective agents

CREATE TABLE IF NOT EXISTS recruits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  current_brokerage VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'prospecting',
  sponsor_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Valid statuses: prospecting, contacted, meeting, offer, signed, lost

-- RLS
ALTER TABLE recruits ENABLE ROW LEVEL SECURITY;

-- Admins can manage all recruits
CREATE POLICY "Admins can manage recruits" ON recruits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
  );

-- Agents can view and manage recruits they sponsor
CREATE POLICY "Agents can manage own recruits" ON recruits
  FOR ALL USING (sponsor_agent_id = auth.uid());

-- Create index
CREATE INDEX idx_recruits_sponsor ON recruits(sponsor_agent_id);
CREATE INDEX idx_recruits_status ON recruits(status);
