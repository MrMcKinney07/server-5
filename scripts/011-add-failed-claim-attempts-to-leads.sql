-- Add failed_claim_attempts field to leads table
-- Tracks how many times a lead has been rotated due to unclaimed expiry

ALTER TABLE leads ADD COLUMN IF NOT EXISTS failed_claim_attempts int DEFAULT 0;

-- Add index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_leads_failed_claim_attempts ON leads(failed_claim_attempts);

COMMENT ON COLUMN leads.failed_claim_attempts IS 'Number of times this lead was auto-rotated due to agent not claiming. Max 2 before fallback to broker.';
