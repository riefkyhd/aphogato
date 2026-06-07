import { resolvePhotoShotAt } from "@/lib/photoShootingTime";
import type { Photo } from "@/lib/types";

export type PhotoSortMode = "shooting-time" | "name" | "time-added";

function compareFilename(a: Photo, b: Photo): number {
  const cmp = a.filename.localeCompare(b.filename, undefined, {
    sensitivity: "base",
  });
  if (cmp !== 0) return cmp;
  return a.id.localeCompare(b.id);
}

function compareTimeAdded(a: Photo, b: Photo): number {
  const diff =
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  if (diff !== 0) return diff;
  return compareFilename(a, b);
}

function compareShootingTime(a: Photo, b: Photo): number {
  const ta = resolvePhotoShotAt(a);
  const tb = resolvePhotoShotAt(b);
  const aMs = ta ? new Date(ta).getTime() : Number.POSITIVE_INFINITY;
  const bMs = tb ? new Date(tb).getTime() : Number.POSITIVE_INFINITY;
  if (aMs !== bMs) return aMs - bMs;
  return compareTimeAdded(a, b);
}

export function sortPhotos(photos: Photo[], mode: PhotoSortMode): Photo[] {
  const sorted = [...photos];
  switch (mode) {
    case "name":
      return sorted.sort(compareFilename);
    case "shooting-time":
      return sorted.sort(compareShootingTime);
    case "time-added":
    default:
      return sorted.sort(compareTimeAdded);
  }
}

/** Newest uploads first. */
export function sortPhotosNewestFirst(photos: Photo[]): Photo[] {
  return sortPhotos(photos, "time-added");
}
