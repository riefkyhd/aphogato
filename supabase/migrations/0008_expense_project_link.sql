-- Link expenses to gallery projects (in addition to calendar events).

alter table public.expense_entries
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists expense_entries_event_id_idx
  on public.expense_entries (event_id)
  where event_id is not null;

create index if not exists expense_entries_project_id_idx
  on public.expense_entries (project_id)
  where project_id is not null;
