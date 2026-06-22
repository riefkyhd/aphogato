import type { Photo, Project } from "@/lib/types";

/** Resolve the cover delivery URL for a project from its photos. */
export function resolveProjectCoverUrl(
  project: Pick<Project, "cover_photo_id">,
  photos: Photo[]
): string | null {
  if (project.cover_photo_id) {
    const cover = photos.find((photo) => photo.id === project.cover_photo_id);
    if (cover) return cover.cloudinary_url;
  }

  if (photos.length === 0) return null;

  const sorted = [...photos].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
  return sorted[0]?.cloudinary_url ?? null;
}
