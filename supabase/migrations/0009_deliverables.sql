create table if not exists public.deliverable_items (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade,
  event_id    uuid references public.events(id) on delete cascade,
  title       text not null,
  done        boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz default now(),
  constraint deliverable_items_context_check check (
    project_id is not null or event_id is not null
  )
);

create index if not exists deliverable_items_project_id_idx
  on public.deliverable_items (project_id);

create index if not exists deliverable_items_event_id_idx
  on public.deliverable_items (event_id);

alter table public.deliverable_items enable row level security;

drop policy if exists "deliverables: authenticated full access" on public.deliverable_items;
create policy "deliverables: authenticated full access" on public.deliverable_items
  for all to authenticated using (true) with check (true);
