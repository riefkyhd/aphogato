create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz default now()
);

create unique index if not exists clients_name_lower_unique
  on public.clients (lower(trim(name)));

alter table public.clients enable row level security;

drop policy if exists "clients: authenticated full access" on public.clients;
create policy "clients: authenticated full access" on public.clients
  for all to authenticated using (true) with check (true);
