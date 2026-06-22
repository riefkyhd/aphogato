create or replace function public.match_photo_faces(
  p_project_id uuid,
  p_embedding vector(128),
  p_threshold double precision default 0.55,
  p_limit integer default 500
)
returns table (photo_id uuid, similarity double precision)
language sql
stable
security definer
set search_path = public
as $$
  select
    pf.photo_id,
    max(1 - (pf.embedding <=> p_embedding))::double precision as similarity
  from public.photo_faces pf
  where pf.project_id = p_project_id
  group by pf.photo_id
  having max(1 - (pf.embedding <=> p_embedding)) >= p_threshold
  order by similarity desc
  limit p_limit;
$$;

revoke all on function public.match_photo_faces(uuid, vector, double precision, integer)
  from public;
grant execute on function public.match_photo_faces(uuid, vector, double precision, integer)
  to service_role;
