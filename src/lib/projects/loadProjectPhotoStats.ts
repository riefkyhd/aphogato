import type { SupabaseClient } from "@supabase/supabase-js";

export type ProjectPhotoStats = {
  cover_url: string | null;
  photo_count: number;
};

export async function loadProjectPhotoStats(
  supabase: SupabaseClient,
  projectIds: string[]
): Promise<Map<string, ProjectPhotoStats>> {
  const result = new Map<string, ProjectPhotoStats>();
  if (projectIds.length === 0) return result;

  const { data, error } = await supabase.rpc("get_project_photo_stats", {
    p_project_ids: projectIds,
  });

  if (error || !data) return result;

  for (const row of data as Array<{
    project_id: string;
    cover_url: string | null;
    photo_count: number | string;
  }>) {
    result.set(row.project_id, {
      cover_url: row.cover_url,
      photo_count: Number(row.photo_count),
    });
  }

  return result;
}
