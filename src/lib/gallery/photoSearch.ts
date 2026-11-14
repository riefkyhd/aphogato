import type { Photo } from "@/lib/types";

/**
 * Filter an array of photos by filename query.
 * Case-insensitive, trimmed, matching substring.
 */
export function filterPhotosByFilename(
  photos: Photo[],
  rawQuery: string
): Photo[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return photos;

  // Split query words for multi-token matching (e.g. "DSC 012" matches "DSC_0123.jpg")
  const tokens = query.split(/\s+/).filter(Boolean);

  return photos.filter((photo) => {
    const filename = (photo.filename ?? "").toLowerCase();
    return tokens.every((token) => filename.includes(token));
  });
}
