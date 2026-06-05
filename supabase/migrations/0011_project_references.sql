create table if not exists public.project_references (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  filename        text not null,
  cloudinary_url  text not null,
  caption         text,
  sort_order      integer not null default 0,
  created_at      timestamptz default now()
);

create index if not exists project_references_project_id_idx
  on public.project_references (project_id);

alter table public.project_references enable row level security;

drop policy if exists "project_references: authenticated full access" on public.project_references;
create policy "project_references: authenticated full access" on public.project_references
  for all to authenticated using (true) with check (true);
