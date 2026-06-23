-- Per-project media storage: Cloudinary (default) or ImageKit.
alter table public.projects
  add column if not exists storage_provider text not null default 'cloudinary';

alter table public.projects
  drop constraint if exists projects_storage_provider_check;

alter table public.projects
  add constraint projects_storage_provider_check
  check (storage_provider in ('cloudinary', 'imagekit'));

alter table public.photos
  add column if not exists imagekit_file_id text;

create index if not exists photos_imagekit_file_id_idx on public.photos(imagekit_file_id)
  where imagekit_file_id is not null;
