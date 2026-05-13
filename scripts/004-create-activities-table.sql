-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'call', 'text', 'email', 'status_change', 'mission', 'assignment', 'other')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can read activities for contacts they have access to
CREATE POLICY "Agents can read activities"
  ON public.activities
  FOR SELECT
  USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND (c.primary_agent_id = auth.uid() OR c.primary_agent_id IS NULL)
    )
    OR EXISTS (
      SELECT 1 FROM public.agents
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Agents can insert activities
CREATE POLICY "Agents can insert activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agents
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS activities_contact_idx ON public.activities(contact_id);
CREATE INDEX IF NOT EXISTS activities_lead_idx ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS activities_agent_idx ON public.activities(agent_id);
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON public.activities(created_at DESC);
