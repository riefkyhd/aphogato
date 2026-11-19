-- Migration 0029: Multi-Currency Support for Quotations, Invoices & Finance
-- Additive columns to support foreign currencies, locked exchange rates, and IDR accounting snapshots

-- 1. Quotations: currency and locked rate snapshot
alter table public.quotations
  add column if not exists currency text not null default 'IDR',
  add column if not exists exchange_rate_to_idr numeric not null default 1,
  add column if not exists exchange_rate_date timestamptz default now(),
  add column if not exists total_idr numeric;

-- 2. Income entries: preserve locked rate and original foreign amount
alter table public.income_entries
  add column if not exists exchange_rate_to_idr numeric not null default 1,
  add column if not exists exchange_rate_date timestamptz default now(),
  add column if not exists original_amount numeric;

-- 3. Exchange rate cache table: store daily rates from external API
create table if not exists public.exchange_rate_cache (
  base_currency text primary key,
  target_currency text not null default 'IDR',
  rate_to_idr numeric not null,
  fetched_at timestamptz not null default now()
);

alter table public.exchange_rate_cache enable row level security;

drop policy if exists "exchange_rate_cache: authenticated full access" on public.exchange_rate_cache;
create policy "exchange_rate_cache: authenticated full access" on public.exchange_rate_cache
  for all to authenticated using (true) with check (true);
