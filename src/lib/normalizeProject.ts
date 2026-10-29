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
    storage_provider:
      p.storage_provider === "imagekit"
        ? "imagekit"
        : p.storage_provider === "gdrive"
          ? "gdrive"
          : "cloudinary",
    gdrive_folder_id: p.gdrive_folder_id ?? null,
    gdrive_finals_folder_id: p.gdrive_finals_folder_id ?? null,
    gdrive_finals_share_url: p.gdrive_finals_share_url ?? null,
  };
}
