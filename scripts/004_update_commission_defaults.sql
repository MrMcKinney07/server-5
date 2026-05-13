-- Update commission plan defaults per new requirements
-- 70/30 split (already correct)
-- Transaction fee: 499
-- Replace annual cap concept with marketing fund threshold: 20k

ALTER TABLE commission_plans 
  ALTER COLUMN transaction_fee SET DEFAULT 499.00;

-- Rename cap_amount to marketing_fund_threshold for clarity
ALTER TABLE commission_plans 
  RENAME COLUMN cap_amount TO marketing_fund_threshold;

-- Set default marketing fund threshold to 20,000
ALTER TABLE commission_plans
  ALTER COLUMN marketing_fund_threshold SET DEFAULT 20000.00;

-- Update agent_commission_plans table as well
ALTER TABLE agent_commission_plans
  RENAME COLUMN override_annual_cap TO override_marketing_fund_threshold;

COMMENT ON COLUMN commission_plans.marketing_fund_threshold IS 'Marketing fund threshold amount - when agent reaches this in commissions, they contribute to marketing fund';
COMMENT ON COLUMN agent_commission_plans.override_marketing_fund_threshold IS 'Override marketing fund threshold for this specific agent';
