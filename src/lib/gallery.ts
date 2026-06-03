import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
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

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  if (photosError) {
    throw new Error(photosError.message);
  }

  const all = (photos ?? []) as Photo[];
  const p = project as Project;

  return {
    project: p,
    photos: all,
    confirmedSelectedIds: all.filter((ph) => ph.is_selected).map((ph) => ph.id),
  };
}
