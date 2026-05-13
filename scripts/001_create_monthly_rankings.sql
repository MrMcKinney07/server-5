-- Create monthly_agent_stats table for monthly leaderboard rankings
CREATE TABLE IF NOT EXISTS public.monthly_agent_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- Format: 'YYYY-MM'
  missions_completed integer DEFAULT 0,
  total_xp_earned integer DEFAULT 0,
  rank integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_agent_stats_agent ON public.monthly_agent_stats(agent_id);
CREATE INDEX IF NOT EXISTS idx_monthly_agent_stats_month ON public.monthly_agent_stats(month_year DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_agent_stats_rank ON public.monthly_agent_stats(month_year, rank);

-- Enable RLS
ALTER TABLE public.monthly_agent_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own stats" ON public.monthly_agent_stats FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "Anyone can view all stats for rankings" ON public.monthly_agent_stats FOR SELECT USING (true);
CREATE POLICY "System can upsert stats" ON public.monthly_agent_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update stats" ON public.monthly_agent_stats FOR UPDATE USING (true);

COMMENT ON TABLE public.monthly_agent_stats IS 'Monthly aggregated statistics for agent rankings - resets each month';
