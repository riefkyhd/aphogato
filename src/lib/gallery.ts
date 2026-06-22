import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { normalizeProject } from "@/lib/normalizeProject";
import { getProjectFaceSearchStatus } from "@/lib/faces/projectFaceCounts";
import { fetchAllProjectPhotos } from "@/lib/photos/fetchProjectPhotos";
import type { FaceSearchStatus } from "@/lib/faces/types";
import type { Photo, Project } from "@/lib/types";

export type GalleryData = {
  project: Project;
  photos: Photo[];
  confirmedSelectedIds: string[];
  faceSearch: FaceSearchStatus;
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
  const faceSearch = await getProjectFaceSearchStatus(
    supabase,
    project.id,
    p.face_search_enabled
  );

  return {
    project: p,
    photos: all,
    confirmedSelectedIds: all.filter((ph) => ph.is_selected).map((ph) => ph.id),
    faceSearch,
  };
}
