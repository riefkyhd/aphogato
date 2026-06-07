import type { PhotoSortMode } from "@/lib/sortPhotos";

const KEY_PREFIX = "photo-sort-";

const VALID_MODES = new Set<PhotoSortMode>([
  "shooting-time",
  "name",
  "time-added",
]);

export function photoSortStorageKey(id: string) {
  return `${KEY_PREFIX}${id}`;
}

export function readPhotoSortPreference(id: string): PhotoSortMode {
  if (typeof window === "undefined") return "time-added";
  try {
    const raw = window.localStorage.getItem(photoSortStorageKey(id));
    if (raw && VALID_MODES.has(raw as PhotoSortMode)) {
      return raw as PhotoSortMode;
    }
  } catch {
    // ignore
  }
  return "time-added";
}

export function writePhotoSortPreference(id: string, mode: PhotoSortMode) {
  try {
    window.localStorage.setItem(photoSortStorageKey(id), mode);
  } catch {
    // ignore
  }
}

export const PHOTO_SORT_OPTIONS: { value: PhotoSortMode; label: string }[] = [
  { value: "shooting-time", label: "Shooting time" },
  { value: "name", label: "Name" },
  { value: "time-added", label: "Time added" },
];
