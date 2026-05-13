-- Fix RLS policies for agents table
-- The previous policies used incorrect column names ("Role" instead of "role")

-- Drop existing broken policies
DROP POLICY IF EXISTS "Brokers can read all agents" ON agents;
DROP POLICY IF EXISTS "Brokers can update all agents" ON agents;
DROP POLICY IF EXISTS "Admins can read all agents" ON public.agents;

-- Create correct policy: Admins can read all agent records
CREATE POLICY "Admins can read all agents"
ON agents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agents a 
    WHERE a.id = auth.uid() 
    AND a.role = 'admin'
  )
);

-- Policy: Admins can update all agent records
CREATE POLICY "Admins can update all agents"
ON agents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM agents a 
    WHERE a.id = auth.uid() 
    AND a.role = 'admin'
  )
);

-- Policy: Admins can insert agent records (for creating new agents)
CREATE POLICY "Admins can insert agents"
ON agents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agents a 
    WHERE a.id = auth.uid() 
    AND a.role = 'admin'
  )
);
