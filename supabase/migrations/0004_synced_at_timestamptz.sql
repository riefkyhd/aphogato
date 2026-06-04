alter table public.events
  alter column synced_at type timestamptz using synced_at at time zone 'UTC';

alter table public.events
  alter column created_at type timestamptz using created_at at time zone 'UTC';
