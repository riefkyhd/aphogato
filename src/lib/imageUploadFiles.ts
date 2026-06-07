import {
  ALLOWED_IMAGE_UPLOAD_TYPES,
  IMAGE_UPLOAD_ACCEPT,
} from "@/lib/imageUploadLimits";

export { IMAGE_UPLOAD_ACCEPT };

export function isImageUploadFile(file: File): boolean {
  return ALLOWED_IMAGE_UPLOAD_TYPES.has(file.type);
}

export function filterImageUploadFiles(files: FileList | File[] | null): File[] {
  if (!files?.length) return [];
  return Array.from(files).filter(isImageUploadFile);
}

export function dragEventHasFiles(event: DragEvent): boolean {
  const types = Array.from(event.dataTransfer?.types ?? []);
  return (
    types.includes("Files") ||
    types.includes("application/x-moz-file") ||
    types.some((t) => t.startsWith("image/"))
  );
}

export function countDraggedFiles(event: DragEvent): number | null {
  const items = event.dataTransfer?.items;
  if (!items?.length) return null;
  const fileItems = Array.from(items).filter((item) => item.kind === "file");
  return fileItems.length > 0 ? fileItems.length : null;
}
