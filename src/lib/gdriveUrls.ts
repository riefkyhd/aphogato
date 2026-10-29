/** Google Drive delivery & media proxy URL helpers (client + server safe). */

export function isGDriveUrl(src: string): boolean {
  if (!src) return false;
  return src.startsWith("gdrive://") || src.startsWith("/api/media/") || src.includes("/api/media/");
}

export function extractGDriveFileIdFromUrl(src: string): string | null {
  if (src.startsWith("gdrive://")) {
    return src.replace("gdrive://", "").split("?")[0];
  }
  const match = src.match(/\/api\/media\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

/** Builds the URL targeting our Edge-cached Google Drive media proxy. */
export function gdriveMediaUrl(
  photoIdOrFileId: string,
  width?: number,
  download?: boolean
): string {
  // If it's already a full relative /api/media URL, extract base ID
  const cleanId = photoIdOrFileId.startsWith("gdrive://")
    ? photoIdOrFileId.replace("gdrive://", "")
    : photoIdOrFileId.startsWith("/api/media/")
      ? photoIdOrFileId.replace("/api/media/", "").split("?")[0]
      : photoIdOrFileId;

  const params = new URLSearchParams();
  if (width) params.set("w", String(width));
  if (download) params.set("download", "1");

  const query = params.toString();
  return `/api/media/${encodeURIComponent(cleanId)}${query ? `?${query}` : ""}`;
}

export function gdriveMasonryUrl(src: string, width = 800) {
  return gdriveMediaUrl(src, width);
}

export function gdriveGalleryGridUrl(src: string, width = 900) {
  return gdriveMediaUrl(src, width);
}

export function gdriveListThumbUrl(src: string) {
  return gdriveMediaUrl(src, 120);
}

export function gdrivePreviewLargeUrl(src: string) {
  return gdriveMediaUrl(src, 1400);
}

export function gdriveFaceIndexUrl(src: string, width = 2048) {
  return gdriveMediaUrl(src, width);
}

export function gdriveSocialShareUrl(src: string) {
  return gdriveMediaUrl(src, 1200);
}

export function gdriveGallerySrcSet(src: string, baseWidth: number): string {
  const widths = Array.from(
    new Set([baseWidth, Math.min(baseWidth * 2, 900)])
  ).sort((a, b) => a - b);
  return widths.map((w) => `${gdriveGalleryGridUrl(src, w)} ${w}w`).join(", ");
}
