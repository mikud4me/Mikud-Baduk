-- Single-row cache for Bank of Israel mortgage rates, refreshed at most once a
-- day. Every refinance analysis reads this instead of calling BOI directly;
-- only the request that finds it stale re-fetches and updates it for everyone.
create table if not exists public.boi_rate_cache (
  id smallint primary key default 1,
  prime numeric not null,
  fixed_unlinked numeric not null,
  fixed_linked numeric not null,
  fetched_at timestamptz not null default now(),
  constraint boi_rate_cache_singleton check (id = 1)
);

alter table public.boi_rate_cache enable row level security;

-- Read-only for clients; only the service role (used by the edge function) writes.
create policy "boi_rate_cache_select_all"
  on public.boi_rate_cache for select
  using (true);
