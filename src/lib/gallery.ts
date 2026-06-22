import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { normalizeProject } from "@/lib/normalizeProject";
import { fetchAllProjectPhotos } from "@/lib/photos/fetchProjectPhotos";
import type { Photo, Project } from "@/lib/types";

export type GalleryData = {
  project: Project;
  photos: Photo[];
  confirmedSelectedIds: string[];
};

/** Load gallery project + photos from Supabase (no caching). */
export async function loadGalleryByToken(
  token: string
): Promise<GalleryData | null> {
  const supabase = createAdminSupabase();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("gallery_token", token)
    .single();

  if (projectError || !project) return null;

  const all = await fetchAllProjectPhotos(supabase, project.id);
  const p = normalizeProject(project as Project);

  return {
    project: p,
    photos: all,
    confirmedSelectedIds: all.filter((ph) => ph.is_selected).map((ph) => ph.id),
  };
}
