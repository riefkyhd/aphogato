-- Migration 0027: Google Drive storage provider and Finals delivery workflow

-- 1. Extend projects table storage_provider check to include 'gdrive'
alter table public.projects
  drop constraint if exists projects_storage_provider_check;

alter table public.projects
  add constraint projects_storage_provider_check
  check (storage_provider in ('cloudinary', 'imagekit', 'gdrive'));

-- 2. Add Google Drive folder pointers and share link to projects
alter table public.projects
  add column if not exists gdrive_folder_id text,
  add column if not exists gdrive_finals_folder_id text,
  add column if not exists gdrive_finals_share_url text;

-- 3. Extend photos table for Google Drive file references and workflow stage (proof vs final)
alter table public.photos
  add column if not exists gdrive_file_id text,
  add column if not exists stage text not null default 'proof';

alter table public.photos
  drop constraint if exists photos_stage_check;

alter table public.photos
  add constraint photos_stage_check
  check (stage in ('proof', 'final'));

create index if not exists photos_gdrive_file_id_idx
  on public.photos(gdrive_file_id)
  where gdrive_file_id is not null;

create index if not exists photos_project_stage_idx
  on public.photos(project_id, stage);

-- 4. Update get_project_photo_stats RPC to count photos across stages cleanly
create or replace function get_project_photo_stats(p_project_ids uuid[])
returns table (project_id uuid, cover_url text, photo_count bigint)
language sql stable as $$
  select
    agg.project_id,
    coalesce(cover_ph.cloudinary_url, agg.first_cover_url) as cover_url,
    agg.photo_count
  from (
    select
      p.project_id,
      (array_agg(p.cloudinary_url order by p.created_at asc))[1] as first_cover_url,
      count(*)::bigint as photo_count
    from photos p
    where p.project_id = any(p_project_ids)
    group by p.project_id
  ) agg
  left join projects pr on pr.id = agg.project_id
  left join photos cover_ph
    on cover_ph.id = pr.cover_photo_id
    and cover_ph.project_id = agg.project_id;
$$;

grant execute on function get_project_photo_stats(uuid[]) to authenticated;
