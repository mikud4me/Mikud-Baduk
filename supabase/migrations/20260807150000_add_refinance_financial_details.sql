-- Bootstrap the original refinance table for a new Supabase project. In the
-- legacy project this table already existed before this migration was created.
create table if not exists public.refinance_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  id_number text,
  email text,
  phone text,
  tier text not null default 'free',
  status text not null default 'new',
  file_url text,
  analysis_result jsonb,
  has_extra_debts boolean not null default false,
  external_debts jsonb not null default '[]'::jsonb,
  analyzed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Refinance intake: information gathered after contact details and before
-- document upload. All new fields are nullable so existing leads remain valid;
-- the application requires the first two before it allows an upload.
alter table public.refinance_leads
  add column if not exists monthly_income numeric,
  add column if not exists property_purchase_price numeric,
  add column if not exists estimated_current_property_value numeric;
