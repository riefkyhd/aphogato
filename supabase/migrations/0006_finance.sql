create table if not exists public.income_entries (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete set null,
  entry_date  date not null,
  amount      numeric(14, 2) not null check (amount >= 0),
  currency    text not null default 'IDR',
  client_name text,
  description text,
  notes       text,
  created_at  timestamptz default now()
);

create unique index if not exists income_entries_event_id_unique
  on public.income_entries (event_id)
  where event_id is not null;

create index if not exists income_entries_entry_date_idx
  on public.income_entries (entry_date);

create table if not exists public.expense_entries (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete set null,
  entry_date  date not null,
  amount      numeric(14, 2) not null check (amount >= 0),
  currency    text not null default 'IDR',
  category    text not null default 'other',
  description text,
  notes       text,
  created_at  timestamptz default now()
);

create index if not exists expense_entries_entry_date_idx
  on public.expense_entries (entry_date);

alter table public.income_entries enable row level security;
alter table public.expense_entries enable row level security;

create policy "income: authenticated full access" on public.income_entries
  for all to authenticated using (true) with check (true);

create policy "expenses: authenticated full access" on public.expense_entries
  for all to authenticated using (true) with check (true);
