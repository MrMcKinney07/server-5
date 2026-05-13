-- Transactions table for tracking real estate deals
-- Can later integrate with SkySlope or other transaction management systems
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'pending_broker_review', 'closed', 'cancelled')),
  external_system text, -- 'skyslope' or NULL for internal only
  external_id text, -- Reference to SkySlope file ID when integrated
  broker_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Agents can view transactions they own or are admin
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid() AND agents.role = 'admin')
  );

-- Agents can create transactions for themselves
CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid());

-- Agents can update their own transactions, admins can update any
CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid() AND agents.role = 'admin')
  );

-- Only admins can delete transactions
CREATE POLICY "transactions_delete" ON transactions
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid() AND agents.role = 'admin')
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_timestamp();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_agent ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_contact ON transactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
