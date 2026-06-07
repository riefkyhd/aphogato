import {
  ALLOWED_IMAGE_UPLOAD_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
} from "@/lib/imageUploadLimits";

export function validateImageUploadMeta(
  filename: string,
  mimeType: string,
  size: number
): string | null {
  if (!filename.trim()) {
    return "Filename is required";
  }
  if (!ALLOWED_IMAGE_UPLOAD_TYPES.has(mimeType)) {
    return `${filename}: unsupported file type`;
  }
  if (size > MAX_IMAGE_UPLOAD_BYTES) {
    return `${filename}: file too large (max 20MB)`;
  }
  if (size <= 0) {
    return `${filename}: file is empty`;
  }
  return null;
}
