-- Create monthly_agent_stats table for monthly ranking resets
CREATE TABLE IF NOT EXISTS public.monthly_agent_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  total_points integer DEFAULT 0,
  missions_completed integer DEFAULT 0,
  rank integer,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_agent_stats_period ON public.monthly_agent_stats(year, month, rank);
CREATE INDEX IF NOT EXISTS idx_monthly_agent_stats_agent ON public.monthly_agent_stats(agent_id, year DESC, month DESC);

-- Enable RLS
ALTER TABLE public.monthly_agent_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view monthly stats" ON public.monthly_agent_stats FOR SELECT USING (true);
CREATE POLICY "System can manage monthly stats" ON public.monthly_agent_stats FOR ALL USING (
  EXISTS (SELECT 1 FROM public.agents WHERE id = auth.uid() AND "Role" = 'broker')
);

COMMENT ON TABLE public.monthly_agent_stats IS 'Monthly agent rankings that reset each month';
