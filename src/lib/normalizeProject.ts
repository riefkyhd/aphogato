import { normalizeMaxPhotoSelection } from "@/lib/photoSelectionLimit";
import type { Project } from "@/lib/types";

/** Ensures project rows from Supabase include a valid max_photo_selection. */
export function normalizeProject(row: Project | Record<string, unknown>): Project {
  const p = row as Project;
  return {
    ...p,
    max_photo_selection: normalizeMaxPhotoSelection(p.max_photo_selection),
    face_search_enabled: Boolean(p.face_search_enabled),
    cover_photo_id:
      typeof p.cover_photo_id === "string" ? p.cover_photo_id : null,
  };
}
