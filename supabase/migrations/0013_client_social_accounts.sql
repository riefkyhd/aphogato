alter table public.clients
  add column if not exists social_accounts jsonb not null default '[]'::jsonb;
