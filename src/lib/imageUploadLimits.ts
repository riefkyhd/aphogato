export const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;

export const IMAGE_UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

export const ALLOWED_IMAGE_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export const MAX_IMAGE_UPLOAD_FILES_PER_REQUEST = 40;
