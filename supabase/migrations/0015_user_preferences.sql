-- Per-user workflow and privacy defaults (synced across devices).

create table if not exists public.user_preferences (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  preferences   jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

create index if not exists user_preferences_updated_at_idx
  on public.user_preferences (updated_at desc);

alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences: own row only" on public.user_preferences;
create policy "user_preferences: own row only" on public.user_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on table public.user_preferences is
  'Per-auth-user workflow defaults (finance masking, reminders, photo/calendar defaults).';
