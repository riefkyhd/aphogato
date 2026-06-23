import type { Project } from "@/lib/types";

export type StorageProvider = "cloudinary" | "imagekit";

export function normalizeStorageProvider(
  value: string | null | undefined
): StorageProvider {
  return value === "imagekit" ? "imagekit" : "cloudinary";
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
