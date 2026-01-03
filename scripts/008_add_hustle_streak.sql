-- Add hustle streak columns to agents table
ALTER TABLE public.agents 
  ADD COLUMN IF NOT EXISTS login_streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date date,
  ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;

COMMENT ON COLUMN public.agents.login_streak IS 'Current consecutive daily login streak';
COMMENT ON COLUMN public.agents.last_login_date IS 'Date of last login (for streak tracking)';
COMMENT ON COLUMN public.agents.longest_streak IS 'Longest streak ever achieved';
