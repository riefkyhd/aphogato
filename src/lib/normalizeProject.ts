import { normalizeMaxPhotoSelection } from "@/lib/photoSelectionLimit";
import type { Project } from "@/lib/types";

/** Ensures project rows from Supabase include a valid max_photo_selection. */
export function normalizeProject(row: Project | Record<string, unknown>): Project {
  const p = row as Project;
  return {
    ...p,
    max_photo_selection: normalizeMaxPhotoSelection(p.max_photo_selection),
  };
}
