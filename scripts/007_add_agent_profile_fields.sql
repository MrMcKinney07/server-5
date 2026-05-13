-- Add additional agent profile fields
ALTER TABLE public.agents 
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS license_expiry date,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS team_id uuid,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zip text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS commission_plan_id uuid REFERENCES public.commission_plans(id);

COMMENT ON COLUMN public.agents.license_number IS 'Real estate license number';
COMMENT ON COLUMN public.agents.license_expiry IS 'License expiration date';
COMMENT ON COLUMN public.agents.start_date IS 'Date agent joined the brokerage';
COMMENT ON COLUMN public.agents.team_id IS 'Team the agent is assigned to';
COMMENT ON COLUMN public.agents.commission_plan_id IS 'Commission plan assigned to agent';
COMMENT ON COLUMN public.agents.bio IS 'Agent biography/description';

-- Create index for team lookups
CREATE INDEX IF NOT EXISTS idx_agents_team_id ON public.agents(team_id);
CREATE INDEX IF NOT EXISTS idx_agents_commission_plan ON public.agents(commission_plan_id);
