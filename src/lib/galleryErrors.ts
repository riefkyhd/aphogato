export const GALLERY_ERROR_CODES = {
  STALE_SELECTION: "STALE_SELECTION",
  GALLERY_NOT_FOUND: "GALLERY_NOT_FOUND",
  NETWORK: "NETWORK",
} as const;

export type GalleryErrorCode =
  (typeof GALLERY_ERROR_CODES)[keyof typeof GALLERY_ERROR_CODES];

export const GALLERY_MESSAGES = {
  staleSelection:
    "Some photos in your selection are no longer in this gallery. The list has been refreshed — please review and save again.",
  staleSelectionSingle:
    "A photo you selected is no longer in this gallery. The list has been refreshed — please review and save again.",
  galleryNotFound: "This gallery link is invalid or the project was removed.",
  loadFailed: "We couldn't load the gallery. Check your connection and try again.",
  saveFailed: "We couldn't save your selection. Please try again.",
  network: "Connection problem. Check your internet and try again.",
  syncSuccess: "Gallery refreshed.",
  syncPruned: (count: number) =>
    count === 1
      ? "1 photo is no longer available and was removed from your selection."
      : `${count} photos are no longer available and were removed from your selection.`,
  galleryEmpty:
    "There are no photos in this gallery right now. Ask your photographer to upload more.",
} as const;

export function staleSelectionMessage(missingCount: number): string {
  return missingCount === 1
    ? GALLERY_MESSAGES.staleSelectionSingle
    : GALLERY_MESSAGES.staleSelection;
}
