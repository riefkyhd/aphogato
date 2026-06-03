-- Aphogato — initial schema
-- Run in the Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  client_name        text,
  cloudinary_folder  text not null,
  gallery_token      text unique not null,
  created_at         timestamp default now(),
  status             text default 'pending'
);

create table if not exists public.photos (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.projects(id) on delete cascade,
  filename        text not null,
  cloudinary_url  text not null,
  is_selected     boolean default false,
  created_at      timestamp default now()
);

create index if not exists photos_project_id_idx on public.photos(project_id);
create index if not exists projects_gallery_token_idx on public.projects(gallery_token);

-- Row-level security
alter table public.projects enable row level security;
alter table public.photos   enable row level security;

-- Authenticated photographer has full access. The gallery API uses the
-- service role key and bypasses RLS, so no public policy is required.
drop policy if exists "projects: authenticated full access" on public.projects;
create policy "projects: authenticated full access" on public.projects
  for all to authenticated using (true) with check (true);

drop policy if exists "photos: authenticated full access" on public.photos;
create policy "photos: authenticated full access" on public.photos
  for all to authenticated using (true) with check (true);
