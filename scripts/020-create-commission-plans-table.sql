-- Commission plans table for McKinney One
-- Each agent can have a custom plan, or use the default brokerage plan

CREATE TABLE IF NOT EXISTS commission_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  -- Default split percentage (agent keeps this %)
  default_split_percent DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  -- Annual cap amount (after which agent keeps 100%)
  annual_cap DECIMAL(12,2),
  -- Per-transaction fees
  transaction_fee DECIMAL(10,2) DEFAULT 395.00,
  e_and_o_fee DECIMAL(10,2) DEFAULT 40.00,
  tech_fee DECIMAL(10,2) DEFAULT 25.00,
  -- Is this the default plan for new agents?
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent commission plan overrides (per-agent customization)
CREATE TABLE IF NOT EXISTS agent_commission_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  commission_plan_id UUID REFERENCES commission_plans(id) ON DELETE SET NULL,
  -- Override fields (null means use plan default)
  override_split_percent DECIMAL(5,2),
  override_annual_cap DECIMAL(12,2),
  override_transaction_fee DECIMAL(10,2),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id)
);

-- RLS policies
ALTER TABLE commission_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commission_plans ENABLE ROW LEVEL SECURITY;

-- Admins can manage commission plans
CREATE POLICY "Admins can manage commission plans" ON commission_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
  );

-- All authenticated users can view commission plans
CREATE POLICY "Authenticated users can view commission plans" ON commission_plans
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admins can manage agent commission plans
CREATE POLICY "Admins can manage agent commission plans" ON agent_commission_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
  );

-- Agents can view their own commission plan
CREATE POLICY "Agents can view own commission plan" ON agent_commission_plans
  FOR SELECT USING (agent_id = auth.uid());
