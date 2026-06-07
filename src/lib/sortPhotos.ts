import { resolvePhotoShotAt } from "@/lib/photoShootingTime";
import type { Photo } from "@/lib/types";

export type PhotoSortMode = "shooting-time" | "name" | "time-added";
export type PhotoSortDirection = "asc" | "desc";

export const DEFAULT_SORT_DIRECTION: Record<PhotoSortMode, PhotoSortDirection> = {
  "shooting-time": "asc",
  name: "asc",
  "time-added": "desc",
};

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

function shootingTimeMs(photo: Photo): number {
  const shot = resolvePhotoShotAt(photo);
  if (shot) return new Date(shot).getTime();
  return new Date(photo.created_at).getTime();
}

function compareShootingTime(a: Photo, b: Photo): number {
  const diff = shootingTimeMs(a) - shootingTimeMs(b);
  if (diff !== 0) return diff;
  return compareTimeAdded(a, b);
}

function getComparator(mode: PhotoSortMode): (a: Photo, b: Photo) => number {
  switch (mode) {
    case "name":
      return compareFilename;
    case "shooting-time":
      return compareShootingTime;
    case "time-added":
    default:
      return compareTimeAdded;
  }
}

function applyDirection(
  compare: (a: Photo, b: Photo) => number,
  direction: PhotoSortDirection
): (a: Photo, b: Photo) => number {
  if (direction === "asc") return compare;
  return (a, b) => -compare(a, b);
}

export function sortPhotos(
  photos: Photo[],
  mode: PhotoSortMode,
  direction: PhotoSortDirection = DEFAULT_SORT_DIRECTION[mode]
): Photo[] {
  return [...photos].sort(applyDirection(getComparator(mode), direction));
}

/** Newest uploads first. */
export function sortPhotosNewestFirst(photos: Photo[]): Photo[] {
  return sortPhotos(photos, "time-added", "desc");
}
