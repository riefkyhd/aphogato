create table if not exists public.quotations (
  id              uuid primary key default gen_random_uuid(),
  quote_number    text not null,
  quote_date      date,
  valid_until     date,
  client_name     text,
  client_phone    text,
  client_social   text,
  project_title   text,
  event_date      date,
  event_location  text,
  event_duration  text,
  line_items      jsonb not null default '[]',
  deliverables    jsonb not null default '[]',
  notes           text,
  terms           text,
  subtotal        numeric(14, 2) not null default 0 check (subtotal >= 0),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create unique index if not exists quotations_quote_number_unique
  on public.quotations (quote_number);

create index if not exists quotations_quote_date_idx
  on public.quotations (quote_date desc nulls last, created_at desc);

create index if not exists quotations_client_name_idx
  on public.quotations (client_name);

alter table public.quotations enable row level security;

drop policy if exists "quotations: authenticated full access" on public.quotations;
create policy "quotations: authenticated full access" on public.quotations
  for all to authenticated using (true) with check (true);
