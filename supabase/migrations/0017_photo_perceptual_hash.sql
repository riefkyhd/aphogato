-- Content-based duplicate detection (perceptual hash) for gallery photos and moodboard refs.

alter table public.photos
  add column if not exists perceptual_hash text;

alter table public.project_references
  add column if not exists perceptual_hash text;

create index if not exists photos_project_perceptual_hash_idx
  on public.photos (project_id)
  where perceptual_hash is not null;

create index if not exists project_references_project_perceptual_hash_idx
  on public.project_references (project_id)
  where perceptual_hash is not null;
