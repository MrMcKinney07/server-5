-- Saved searches for agents or contacts
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  name text NOT NULL,
  query jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT saved_searches_owner_check CHECK (
    (agent_id IS NOT NULL AND contact_id IS NULL) OR
    (agent_id IS NULL AND contact_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Agents can view their own saved searches
CREATE POLICY "saved_searches_agent_select" ON saved_searches
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "saved_searches_agent_insert" ON saved_searches
  FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "saved_searches_agent_delete" ON saved_searches
  FOR DELETE TO authenticated
  USING (agent_id = auth.uid());
