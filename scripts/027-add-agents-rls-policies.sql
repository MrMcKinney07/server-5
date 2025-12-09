-- Add RLS policies for agents table
-- This allows users to read their own agent record and insert their own record

-- Policy: Users can read their own agent record
CREATE POLICY "Users can read own agent record"
ON agents
FOR SELECT
USING (id = auth.uid());

-- Policy: Users can insert their own agent record (for auto-creation on signup)
CREATE POLICY "Users can insert own agent record"
ON agents
FOR INSERT
WITH CHECK (id = auth.uid());

-- Policy: Users can update their own agent record
CREATE POLICY "Users can update own agent record"
ON agents
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy: Brokers and admins can read all agent records
CREATE POLICY "Brokers can read all agents"
ON agents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agents a 
    WHERE a.id = auth.uid() 
    AND a."Role" IN ('broker', 'admin')
  )
);

-- Policy: Brokers and admins can update all agent records
CREATE POLICY "Brokers can update all agents"
ON agents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM agents a 
    WHERE a.id = auth.uid() 
    AND a."Role" IN ('broker', 'admin')
  )
);
