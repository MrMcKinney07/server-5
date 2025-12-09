-- Create agents table linked to auth.users
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'admin')),
  segment TEXT NOT NULL DEFAULT 'new' CHECK (segment IN ('new', 'seasoned')),
  tier INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own agent record
CREATE POLICY "Users can read own agent record"
  ON public.agents
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can read all agent records
CREATE POLICY "Admins can read all agents"
  ON public.agents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can update their own agent record (limited fields)
CREATE POLICY "Users can update own agent record"
  ON public.agents
  FOR UPDATE
  USING (auth.uid() = id);

-- Auto-insert agent row on user signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agents (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
