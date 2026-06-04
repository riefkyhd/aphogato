create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  client_name     text,
  shoot_type      text default 'other',
  location        text,
  shoot_date      date not null,
  shoot_time      text,
  status          text default 'scheduled',
  notes           text,
  project_id      uuid references public.projects(id) on delete set null,
  google_event_id text,
  synced_at       timestamp,
  created_at      timestamp default now()
);

create index if not exists events_shoot_date_idx on public.events(shoot_date);

alter table public.events enable row level security;

create policy "events: authenticated full access" on public.events
  for all to authenticated using (true) with check (true);

create table if not exists public.settings (
  key   text primary key,
  value text not null
);

alter table public.settings enable row level security;

create policy "settings: authenticated full access" on public.settings
  for all to authenticated using (true) with check (true);
