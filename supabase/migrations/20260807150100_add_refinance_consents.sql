-- Explicit intake consents collected before a refinance document is uploaded.
alter table public.refinance_leads
  add column if not exists contact_consent boolean not null default false,
  add column if not exists terms_accepted boolean not null default false,
  add column if not exists terms_accepted_at timestamptz;
