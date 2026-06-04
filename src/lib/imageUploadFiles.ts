export const IMAGE_UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export function isImageUploadFile(file: File): boolean {
  return ALLOWED_TYPES.has(file.type);
}

export function filterImageUploadFiles(files: FileList | File[] | null): File[] {
  if (!files?.length) return [];
  return Array.from(files).filter(isImageUploadFile);
}

export function dragEventHasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}
