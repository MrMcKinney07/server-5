-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  primary_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can read contacts they are assigned to or unassigned contacts
CREATE POLICY "Agents can read assigned contacts"
  ON public.contacts
  FOR SELECT
  USING (
    primary_agent_id = auth.uid()
    OR primary_agent_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.agents
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Agents can insert contacts
CREATE POLICY "Agents can insert contacts"
  ON public.contacts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Policy: Agents can update contacts they are assigned to
CREATE POLICY "Agents can update assigned contacts"
  ON public.contacts
  FOR UPDATE
  USING (
    primary_agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.agents
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contacts_updated_at ON public.contacts;
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
