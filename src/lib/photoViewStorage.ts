export type PhotoViewMode = "grid" | "list";

const KEY_PREFIX = "photo-view-";

export function photoViewStorageKey(id: string) {
  return `${KEY_PREFIX}${id}`;
}

export function readPhotoViewPreference(id: string): PhotoViewMode {
  if (typeof window === "undefined") return "grid";
  try {
    const raw = window.localStorage.getItem(photoViewStorageKey(id));
    if (raw === "list" || raw === "grid") return raw;
  } catch {
    // ignore
  }
  return "grid";
}

export function writePhotoViewPreference(id: string, mode: PhotoViewMode) {
  try {
    window.localStorage.setItem(photoViewStorageKey(id), mode);
  } catch {
    // ignore
  }
}
