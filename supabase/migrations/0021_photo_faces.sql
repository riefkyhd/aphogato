-- Face search: optional per-project client gallery feature (sport / team events).
create extension if not exists vector;

alter table public.projects
  add column if not exists face_search_enabled boolean not null default false;

create table if not exists public.photo_faces (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  photo_id    uuid not null references public.photos(id) on delete cascade,
  bbox_x      real not null check (bbox_x >= 0 and bbox_x <= 1),
  bbox_y      real not null check (bbox_y >= 0 and bbox_y <= 1),
  bbox_w      real not null check (bbox_w > 0 and bbox_w <= 1),
  bbox_h      real not null check (bbox_h > 0 and bbox_h <= 1),
  embedding   vector(128) not null,
  created_at  timestamptz not null default now()
);

create index if not exists photo_faces_project_id_idx
  on public.photo_faces(project_id);

create index if not exists photo_faces_photo_id_idx
  on public.photo_faces(photo_id);

create index if not exists photo_faces_embedding_idx
  on public.photo_faces
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.photo_faces enable row level security;

drop policy if exists "photo_faces: authenticated full access" on public.photo_faces;
create policy "photo_faces: authenticated full access" on public.photo_faces
  for all to authenticated using (true) with check (true);
