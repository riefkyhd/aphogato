-- Per-project Cloudinary account binding (credentials live in env / settings later).
alter table public.projects
  add column if not exists cloudinary_account text not null default 'default';

alter table public.projects
  drop constraint if exists projects_cloudinary_account_check;

alter table public.projects
  add constraint projects_cloudinary_account_check
  check (char_length(cloudinary_account) between 1 and 64);
