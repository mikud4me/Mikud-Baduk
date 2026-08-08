alter table public.refinance_leads
  add column if not exists mix_calculation_context jsonb,
  add column if not exists strategy_mix_results jsonb not null default '{}'::jsonb,
  add column if not exists selected_mix_strategy text;

alter table public.refinance_leads
  drop constraint if exists refinance_leads_selected_mix_strategy_check;

alter table public.refinance_leads
  add constraint refinance_leads_selected_mix_strategy_check
  check (selected_mix_strategy is null or selected_mix_strategy in ('savings', 'cashflow'));
