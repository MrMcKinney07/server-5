-- Deal financials table - tracks commission details per transaction

CREATE TABLE IF NOT EXISTS deal_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  -- Gross commission info
  sale_price DECIMAL(12,2),
  commission_rate DECIMAL(5,4) DEFAULT 0.03, -- 3% default
  gross_commission DECIMAL(12,2) NOT NULL,
  -- Split calculation
  split_percent DECIMAL(5,2) NOT NULL, -- Agent's split at time of deal
  agent_share DECIMAL(12,2) NOT NULL,
  broker_share DECIMAL(12,2) NOT NULL,
  -- Fees deducted
  transaction_fee DECIMAL(10,2) DEFAULT 0,
  e_and_o_fee DECIMAL(10,2) DEFAULT 0,
  tech_fee DECIMAL(10,2) DEFAULT 0,
  other_fees DECIMAL(10,2) DEFAULT 0,
  fee_notes TEXT,
  -- Net to agent after fees
  net_agent_amount DECIMAL(12,2) NOT NULL,
  -- Cap tracking
  ytd_gci_before DECIMAL(12,2) DEFAULT 0, -- Agent's YTD GCI before this deal
  applied_to_cap DECIMAL(12,2) DEFAULT 0, -- Amount that counts toward cap
  -- Timestamps
  closed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(transaction_id)
);

-- RLS policies
ALTER TABLE deal_financials ENABLE ROW LEVEL SECURITY;

-- Admins can manage all deal financials
CREATE POLICY "Admins can manage deal financials" ON deal_financials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
  );

-- Agents can view their own deal financials
CREATE POLICY "Agents can view own deal financials" ON deal_financials
  FOR SELECT USING (agent_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_deal_financials_agent_id ON deal_financials(agent_id);
CREATE INDEX idx_deal_financials_closed_date ON deal_financials(closed_date);
