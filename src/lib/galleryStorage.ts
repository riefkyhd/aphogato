/** Client-safe helpers for gallery selection persistence (not the photo list). */
export function gallerySelectionStorageKey(token: string) {
  return `gallery-selection-${token}`;
}
