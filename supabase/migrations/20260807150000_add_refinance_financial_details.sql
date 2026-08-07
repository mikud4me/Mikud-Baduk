-- Refinance intake: information gathered after contact details and before
-- document upload. All new fields are nullable so existing leads remain valid;
-- the application requires the first two before it allows an upload.
alter table public.refinance_leads
  add column if not exists monthly_income numeric,
  add column if not exists property_purchase_price numeric,
  add column if not exists estimated_current_property_value numeric;
