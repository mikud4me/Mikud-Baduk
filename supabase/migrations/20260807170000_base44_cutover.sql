create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mortgage_leads (
  id uuid primary key default gen_random_uuid(),
  base44_legacy_id text unique,
  full_name text,
  id_number text,
  birth_date date,
  age integer,
  phone text,
  email text,
  email_verified boolean not null default false,
  marital_status text,
  children_under_18 integer,
  purpose text,
  mortgage_type text,
  property_price numeric,
  equity numeric,
  net_income numeric,
  monthly_debts numeric,
  monthly_overdraft numeric,
  loan_duration numeric,
  loan_amount numeric,
  ltv numeric,
  score numeric,
  ai_analysis text,
  is_purchased boolean not null default false,
  status text not null default 'new',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mortgage_leads_created_at_idx on public.mortgage_leads (created_at desc);
create index if not exists mortgage_leads_email_idx on public.mortgage_leads (email);

create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  base44_legacy_id text unique,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  verified boolean not null default false,
  last_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.email_verifications add column if not exists base44_legacy_id text;
create index if not exists email_verifications_email_created_idx on public.email_verifications (email, created_at desc);

create table if not exists public.mortgage_mixes (
  id uuid primary key default gen_random_uuid(),
  base44_legacy_id text unique,
  name text not null,
  total_amount numeric,
  loan_period_years numeric,
  tracks jsonb not null default '[]'::jsonb,
  monthly_payment numeric,
  total_interest numeric,
  total_payment numeric,
  risk_level text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  lead_type text not null check (lead_type in ('mortgage', 'refinance')),
  mortgage_lead_id uuid references public.mortgage_leads(id) on delete set null,
  refinance_lead_id uuid,
  low_profile_id text not null unique,
  transaction_id text,
  amount numeric not null,
  currency text not null default 'ILS',
  status text not null check (status in ('created', 'paid', 'failed')),
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

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
  monthly_income numeric,
  property_purchase_price numeric,
  estimated_current_property_value numeric,
  contact_consent boolean not null default false,
  terms_accepted boolean not null default false,
  terms_accepted_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.refinance_leads add column if not exists id_number text;
alter table public.refinance_leads add column if not exists created_at timestamptz not null default now();
alter table public.refinance_leads add column if not exists updated_at timestamptz not null default now();
alter table public.refinance_leads add column if not exists status text not null default 'new';
alter table public.refinance_leads add column if not exists file_url text;
alter table public.refinance_leads add column if not exists analysis_result jsonb;
alter table public.refinance_leads add column if not exists has_extra_debts boolean not null default false;
alter table public.refinance_leads add column if not exists external_debts jsonb not null default '[]'::jsonb;
alter table public.refinance_leads add column if not exists analyzed_at timestamptz;
alter table public.refinance_leads add column if not exists payload jsonb not null default '{}'::jsonb;

create table if not exists public.refinance_documents (
  id uuid primary key default gen_random_uuid(),
  refinance_lead_id uuid not null references public.refinance_leads(id) on delete cascade,
  storage_path text not null,
  original_filename text,
  analysis jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists mortgage_leads_updated_at on public.mortgage_leads;
create trigger mortgage_leads_updated_at before update on public.mortgage_leads for each row execute function public.set_updated_at();
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists refinance_leads_updated_at on public.refinance_leads;
create trigger refinance_leads_updated_at before update on public.refinance_leads for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.mortgage_leads enable row level security;
alter table public.email_verifications enable row level security;
alter table public.mortgage_mixes enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.refinance_documents enable row level security;
alter table public.refinance_leads enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profile owner can read') then
    create policy "profile owner can read" on public.profiles for select using (auth.uid() = id);
  end if;
end $$;

insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do update set public = false;
