-- Rename cap_amount to marketing_fund_threshold to reflect company marketing fund contribution
ALTER TABLE public.commission_plans 
  RENAME COLUMN cap_amount TO marketing_fund_threshold;

COMMENT ON COLUMN public.commission_plans.marketing_fund_threshold IS 'Amount agent contributes to company marketing fund (default $20,000)';

-- Update default values for any existing plans
UPDATE public.commission_plans 
SET 
  split_percentage = 70,
  marketing_fund_threshold = 20000,
  transaction_fee = 499
WHERE is_default = true;
