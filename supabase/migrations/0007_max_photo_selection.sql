-- Per-project limit on how many photos a client may select in the gallery.

alter table public.projects
  add column if not exists max_photo_selection integer not null default 50;

alter table public.projects
  drop constraint if exists projects_max_photo_selection_check;

alter table public.projects
  add constraint projects_max_photo_selection_check
  check (max_photo_selection >= 1 and max_photo_selection <= 999);
