-- Add agent management fields for admin portal
ALTER TABLE public.agents 
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_sign_in_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS disabled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS disabled_by uuid REFERENCES public.agents(id),
  ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.agents.is_active IS 'Whether agent account is active (can sign in)';
COMMENT ON COLUMN public.agents.last_sign_in_at IS 'Last time agent signed in to the platform';
COMMENT ON COLUMN public.agents.disabled_at IS 'When the account was disabled';
COMMENT ON COLUMN public.agents.disabled_by IS 'Admin/broker who disabled the account';
COMMENT ON COLUMN public.agents.notes IS 'Internal notes about the agent for admin reference';

-- Create index for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON public.agents(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_last_sign_in ON public.agents(last_sign_in_at DESC);
