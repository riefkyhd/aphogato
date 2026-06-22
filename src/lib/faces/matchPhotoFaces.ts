import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_FACE_MATCH_THRESHOLD } from "@/lib/faces/types";

const CLIENT_MATCH_LIMIT = 500;

function formatVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function matchPhotoFaces(
  supabase: SupabaseClient,
  projectId: string,
  embedding: number[],
  threshold = DEFAULT_FACE_MATCH_THRESHOLD
): Promise<{ photoIds: string[]; matchCount: number }> {
  const { data, error } = await supabase.rpc("match_photo_faces", {
    p_project_id: projectId,
    p_embedding: formatVectorLiteral(embedding),
    p_threshold: threshold,
    p_limit: CLIENT_MATCH_LIMIT,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{ photo_id: string; similarity: number }>;
  const photoIds = rows.map((row) => row.photo_id);

  return {
    photoIds,
    matchCount: photoIds.length,
  };
}
