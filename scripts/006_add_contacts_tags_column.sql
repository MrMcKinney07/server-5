-- Add tags column to contacts table if it doesn't exist
ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS tags text[];

COMMENT ON COLUMN public.contacts.tags IS 'Tags for categorizing and grouping contacts';

-- Create index for tag searches
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON public.contacts USING GIN (tags);
