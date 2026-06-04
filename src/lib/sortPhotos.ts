import type { Photo } from "@/lib/types";

/** Newest uploads first. */
export function sortPhotosNewestFirst(photos: Photo[]): Photo[] {
  return [...photos].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
