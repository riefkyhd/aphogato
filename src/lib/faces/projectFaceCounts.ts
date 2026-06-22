import type { SupabaseClient } from "@supabase/supabase-js";
import { buildFaceSearchStatus } from "@/lib/faces/status";
import type { FaceSearchStatus } from "@/lib/faces/types";

export async function getProjectFaceSearchStatus(
  supabase: SupabaseClient,
  projectId: string,
  enabled: boolean
): Promise<FaceSearchStatus> {
  const [{ count: totalPhotos, error: photosError }, faceRows, faceCountRes] =
    await Promise.all([
      supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabase
        .from("photo_faces")
        .select("photo_id")
        .eq("project_id", projectId),
      supabase
        .from("photo_faces")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
    ]);

  if (photosError) {
    throw new Error(photosError.message);
  }
  if (faceRows.error) {
    throw new Error(faceRows.error.message);
  }
  if (faceCountRes.error) {
    throw new Error(faceCountRes.error.message);
  }

  const indexedPhotoIds = new Set(
    (faceRows.data ?? []).map((row) => row.photo_id as string)
  );

  return buildFaceSearchStatus({
    enabled,
    totalPhotos: totalPhotos ?? 0,
    indexedPhotos: indexedPhotoIds.size,
    faceCount: faceCountRes.count ?? 0,
  });
}
