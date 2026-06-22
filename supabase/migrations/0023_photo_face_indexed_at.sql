-- Track face-index attempts even when no faces are detected (avoids re-scan loops).
alter table public.photos
  add column if not exists face_indexed_at timestamptz;

create index if not exists photos_face_indexed_at_idx
  on public.photos (project_id, face_indexed_at);
