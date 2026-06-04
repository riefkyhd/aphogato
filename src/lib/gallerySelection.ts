import type { Photo } from "@/lib/types";

/** IDs in `selected` that are not in the current `photos` list. */
export function findStaleSelectionIds(
  photos: Photo[],
  selected: Set<string>
): string[] {
  const valid = new Set(photos.map((p) => p.id));
  return Array.from(selected).filter((id) => !valid.has(id));
}

export function pruneSelectionToPhotos(
  photos: Photo[],
  selected: Set<string>
): Set<string> {
  const valid = new Set(photos.map((p) => p.id));
  return new Set(Array.from(selected).filter((id) => valid.has(id)));
}
