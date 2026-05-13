-- Agent annual summary - tracks YTD GCI, cap progress, etc.

CREATE TABLE IF NOT EXISTS agent_annual_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  -- Totals
  total_gci DECIMAL(12,2) DEFAULT 0,
  total_agent_earnings DECIMAL(12,2) DEFAULT 0,
  total_broker_share DECIMAL(12,2) DEFAULT 0,
  total_fees_paid DECIMAL(12,2) DEFAULT 0,
  -- Cap tracking
  cap_amount DECIMAL(12,2), -- Cap for this year
  amount_toward_cap DECIMAL(12,2) DEFAULT 0,
  cap_reached_date DATE,
  is_capped BOOLEAN DEFAULT false,
  -- Deal counts
  total_deals INTEGER DEFAULT 0,
  total_volume DECIMAL(14,2) DEFAULT 0,
  -- Updated automatically
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, year)
);

-- RLS policies
ALTER TABLE agent_annual_summaries ENABLE ROW LEVEL SECURITY;

-- Admins can manage all summaries
CREATE POLICY "Admins can manage agent summaries" ON agent_annual_summaries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
  );

-- Agents can view their own summary
CREATE POLICY "Agents can view own summary" ON agent_annual_summaries
  FOR SELECT USING (agent_id = auth.uid());

-- Create index
CREATE INDEX idx_agent_annual_summaries_agent_year ON agent_annual_summaries(agent_id, year);
