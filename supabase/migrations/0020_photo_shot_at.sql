-- Capture time-of-shoot for gallery sorting (EXIF or filename fallback).
alter table public.photos
  add column if not exists shot_at timestamptz;

create index if not exists photos_project_shot_at_idx
  on public.photos (project_id, shot_at);
