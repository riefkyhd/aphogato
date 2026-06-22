ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS cover_photo_id uuid REFERENCES public.photos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_cover_photo_id_idx ON public.projects(cover_photo_id);

CREATE OR REPLACE FUNCTION get_project_photo_stats(p_project_ids uuid[])
RETURNS TABLE (project_id uuid, cover_url text, photo_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    agg.project_id,
    COALESCE(cover_ph.cloudinary_url, agg.first_cover_url) AS cover_url,
    agg.photo_count
  FROM (
    SELECT
      p.project_id,
      (array_agg(p.cloudinary_url ORDER BY p.created_at ASC))[1] AS first_cover_url,
      count(*)::bigint AS photo_count
    FROM photos p
    WHERE p.project_id = ANY(p_project_ids)
    GROUP BY p.project_id
  ) agg
  LEFT JOIN projects pr ON pr.id = agg.project_id
  LEFT JOIN photos cover_ph
    ON cover_ph.id = pr.cover_photo_id
    AND cover_ph.project_id = agg.project_id;
$$;

GRANT EXECUTE ON FUNCTION get_project_photo_stats(uuid[]) TO authenticated;
