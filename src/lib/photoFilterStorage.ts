const KEY_PREFIX = "photo-filter-";

export function photoFilterStorageKey(id: string) {
  return `${KEY_PREFIX}${id}`;
}

export function readPhotoFilterPreference(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(photoFilterStorageKey(id)) === "selected-first";
  } catch {
    return false;
  }
}

export function writePhotoFilterPreference(id: string, selectedFirst: boolean) {
  try {
    if (selectedFirst) {
      window.localStorage.setItem(photoFilterStorageKey(id), "selected-first");
    } else {
      window.localStorage.removeItem(photoFilterStorageKey(id));
    }
  } catch {
    // ignore
  }
}
