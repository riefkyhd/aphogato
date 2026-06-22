import type { SupabaseClient } from "@supabase/supabase-js";
import { buildFaceSearchStatus } from "@/lib/faces/status";
import type { FaceSearchStatus } from "@/lib/faces/types";

export async function getProjectFaceSearchStatus(
  supabase: SupabaseClient,
  projectId: string,
  enabled: boolean
): Promise<FaceSearchStatus> {
  const [
    { count: totalPhotos, error: photosError },
    { count: indexedPhotos, error: indexedError },
    { count: faceCount, error: faceCountError },
  ] = await Promise.all([
    supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
    supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .not("face_indexed_at", "is", null),
    supabase
      .from("photo_faces")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
  ]);

  if (photosError) {
    throw new Error(photosError.message);
  }
  if (indexedError) {
    throw new Error(indexedError.message);
  }
  if (faceCountError) {
    throw new Error(faceCountError.message);
  }

  return buildFaceSearchStatus({
    enabled,
    totalPhotos: totalPhotos ?? 0,
    indexedPhotos: indexedPhotos ?? 0,
    faceCount: faceCount ?? 0,
  });
}
