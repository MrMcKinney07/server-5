-- Add profile_picture_url column to agents table
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS profile_picture_url text;

COMMENT ON COLUMN public.agents.profile_picture_url IS 'URL to agent profile picture stored in Vercel Blob';
