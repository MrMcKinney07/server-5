-- Gamification system for McKinney One

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent earned badges
CREATE TABLE IF NOT EXISTS agent_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, badge_id)
);

-- Agent XP and level tracking
CREATE TABLE IF NOT EXISTS agent_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  raffle_tickets INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Competitions/Challenges
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  metric VARCHAR(100) NOT NULL,
  prize_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Competition entries
CREATE TABLE IF NOT EXISTS competition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, agent_id)
);

-- RLS policies
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;

-- Badges viewable by all, manageable by admins
CREATE POLICY "All can view badges" ON badges FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage badges" ON badges FOR ALL USING (
  EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
);

-- Agent badges
CREATE POLICY "Users view own badges" ON agent_badges FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "All view agent badges" ON agent_badges FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage agent badges" ON agent_badges FOR ALL USING (
  EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
);

-- Agent XP
CREATE POLICY "Users view own xp" ON agent_xp FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "All view agent xp" ON agent_xp FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage agent xp" ON agent_xp FOR ALL USING (
  EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
);

-- Competitions
CREATE POLICY "All view competitions" ON competitions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage competitions" ON competitions FOR ALL USING (
  EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
);

-- Competition entries
CREATE POLICY "All view entries" ON competition_entries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage entries" ON competition_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
);

-- Seed default badges
INSERT INTO badges (type, name, description, xp_reward) VALUES
  ('mission_streak_7', '7-Day Streak', 'Completed all missions 7 days in a row', 100),
  ('mission_streak_30', '30-Day Streak', 'Completed all missions 30 days in a row', 500),
  ('lead_slayer', 'Lead Slayer', 'Closed 10 leads in a single month', 250),
  ('follow_up_king', 'Follow-Up King', 'Made 100 follow-up activities in a month', 150),
  ('first_close', 'First Close', 'Closed your first transaction', 200),
  ('top_producer', 'Top Producer', 'Ranked #1 in monthly leaderboard', 1000),
  ('response_time_champion', 'Speed Demon', 'Average lead response time under 5 minutes', 300),
  ('recruitment_star', 'Recruitment Star', 'Referred an agent who joined the brokerage', 500)
ON CONFLICT (type) DO NOTHING;
