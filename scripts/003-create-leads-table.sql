-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('realtor', 'upnest', 'opcity', 'fb_ads', 'manual', 'referral', 'website', 'other')),
  assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'unclaimed_expired', 'claimed', 'contacted', 'nurture', 'closed', 'lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  claim_expires_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  notes TEXT,
  raw_payload JSONB
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can read leads assigned to them or unassigned leads
CREATE POLICY "Agents can read leads"
  ON public.leads
  FOR SELECT
  USING (
    assigned_agent_id = auth.uid()
    OR assigned_agent_id IS NULL
    OR status = 'new'
    OR EXISTS (
      SELECT 1 FROM public.agents
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Agents can insert leads
CREATE POLICY "Agents can insert leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Policy: Agents can update leads they are assigned to
CREATE POLICY "Agents can update assigned leads"
  ON public.leads
  FOR UPDATE
  USING (
    assigned_agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.agents
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for common queries
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
CREATE INDEX IF NOT EXISTS leads_assigned_agent_idx ON public.leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS leads_contact_idx ON public.leads(contact_id);
