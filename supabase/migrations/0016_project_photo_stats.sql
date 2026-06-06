CREATE OR REPLACE FUNCTION get_project_photo_stats(p_project_ids uuid[])
RETURNS TABLE (project_id uuid, cover_url text, photo_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT p.project_id,
    (array_agg(p.cloudinary_url ORDER BY p.created_at ASC))[1] AS cover_url,
    count(*)::bigint AS photo_count
  FROM photos p
  WHERE p.project_id = ANY(p_project_ids)
  GROUP BY p.project_id;
$$;

GRANT EXECUTE ON FUNCTION get_project_photo_stats(uuid[]) TO authenticated;
