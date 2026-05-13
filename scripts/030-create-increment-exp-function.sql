-- Create function to increment agent exp (for use with RPC)
CREATE OR REPLACE FUNCTION increment_agent_exp(agent_id UUID, exp_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.agents
  SET exp = COALESCE(exp, 0) + exp_amount
  WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
