export function filenameWithoutExtension(filename: string): string {
  const trimmed = filename.trim();
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0) return trimmed;
  return trimmed.slice(0, lastDot);
}

/** Safe basename segment for Cloudinary public_id in dynamic folder mode. */
export function sanitizeCloudinaryBasename(filename: string): string {
  const base = filenameWithoutExtension(filename);
  const sanitized = base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .replace(/_+/g, "_");
  return sanitized || "photo";
}

export function buildPhotoFilename(
  originalFilename: string,
  format?: string | null
): string {
  const ext =
    format?.toLowerCase().replace(/^\./, "") ??
    originalFilename.split(".").pop()?.toLowerCase() ??
    "jpg";
  return `${filenameWithoutExtension(originalFilename)}.${ext}`;
}

export function cloudinaryResourceFilename(
  publicId: string,
  format?: string | null
): string {
  const parts = publicId.split("/");
  const stem = parts[parts.length - 1] ?? publicId;
  return `${stem}.${format ?? "jpg"}`;
}

export function resolveStoredUploadFilename(
  originalFilename: string | undefined | null,
  publicId: string,
  format?: string | null
): string {
  if (originalFilename?.trim()) {
    return buildPhotoFilename(originalFilename.trim(), format);
  }
  return cloudinaryResourceFilename(publicId, format);
}

export function publicIdBelongsToAssetFolder(
  publicId: string,
  assetFolder: string,
  originalFilename?: string | null
): boolean {
  const folder = assetFolder.trim().replace(/^\/+|\/+$/g, "");
  const normalized = publicId.replace(/^\/+|\/+$/g, "");
  if (normalized === folder || normalized.startsWith(`${folder}/`)) {
    return true;
  }
  if (originalFilename?.trim()) {
    const base = sanitizeCloudinaryBasename(originalFilename);
    if (normalized === base || normalized.endsWith(`/${base}`)) {
      return true;
    }
  }
  return false;
}
