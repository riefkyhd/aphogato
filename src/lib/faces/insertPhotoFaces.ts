import type { SupabaseClient } from "@supabase/supabase-js";
import type { PhotoFaceInput } from "@/lib/faces/types";

function formatVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function insertPhotoFaces(
  supabase: SupabaseClient,
  projectId: string,
  photoId: string,
  faces: PhotoFaceInput[]
): Promise<{ error?: string }> {
  if (faces.length === 0) {
    return {};
  }

  const rows = faces.map((face) => ({
    project_id: projectId,
    photo_id: photoId,
    bbox_x: face.bbox_x,
    bbox_y: face.bbox_y,
    bbox_w: face.bbox_w,
    bbox_h: face.bbox_h,
    embedding: formatVectorLiteral(face.embedding),
  }));

  const { error } = await supabase.from("photo_faces").insert(rows);
  if (error) {
    return { error: error.message };
  }
  return {};
}
