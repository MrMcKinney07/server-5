-- Create campaign_enrollments table for contacts (separate from lead_campaign_enrollments)
CREATE TABLE IF NOT EXISTS public.campaign_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
  current_step integer DEFAULT 0,
  next_run_at timestamptz,
  is_paused boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_contact ON public.campaign_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_campaign ON public.campaign_enrollments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_next_run ON public.campaign_enrollments(next_run_at) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.campaign_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "View enrollments for own contacts" ON public.campaign_enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.contacts WHERE id = campaign_enrollments.contact_id AND agent_id = auth.uid())
);
CREATE POLICY "Insert enrollments for own contacts" ON public.campaign_enrollments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.contacts WHERE id = campaign_enrollments.contact_id AND agent_id = auth.uid())
);
CREATE POLICY "Update enrollments for own contacts" ON public.campaign_enrollments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.contacts WHERE id = campaign_enrollments.contact_id AND agent_id = auth.uid())
);
CREATE POLICY "Delete enrollments for own contacts" ON public.campaign_enrollments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.contacts WHERE id = campaign_enrollments.contact_id AND agent_id = auth.uid())
);

COMMENT ON TABLE public.campaign_enrollments IS 'Campaign enrollments for contacts (distinct from lead_campaign_enrollments for leads)';
