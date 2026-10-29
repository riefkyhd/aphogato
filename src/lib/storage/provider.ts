import type { Project } from "@/lib/types";

export type StorageProvider = "cloudinary" | "imagekit" | "gdrive";

export function normalizeStorageProvider(
  value: string | null | undefined
): StorageProvider {
  if (value === "imagekit") return "imagekit";
  if (value === "gdrive") return "gdrive";
  return "cloudinary";
}

export function getProjectStorageProvider(
  project: Pick<Project, "storage_provider">
): StorageProvider {
  return normalizeStorageProvider(project.storage_provider);
}

export function isImageKitProject(
  project: Pick<Project, "storage_provider">
): boolean {
  return getProjectStorageProvider(project) === "imagekit";
}

export function isGDriveProject(
  project: Pick<Project, "storage_provider">
): boolean {
  return getProjectStorageProvider(project) === "gdrive";
}
