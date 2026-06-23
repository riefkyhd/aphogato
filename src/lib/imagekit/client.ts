import "server-only";

import { buildPhotoFilename } from "@/lib/cloudinary/filenames";
import {
  assertImageKitConfigured,
  getImageKitPrivateKey,
  getImageKitUrlEndpoint,
} from "@/lib/imagekit/config";

export type ImageKitFile = {
  fileId: string;
  name: string;
  url: string;
  size: number | null;
  filePath: string;
};

type ImageKitListItem = {
  type?: string;
  fileId?: string;
  name?: string;
  url?: string;
  size?: number;
  filePath?: string;
};

function imageKitAuthHeader(): string {
  const privateKey = getImageKitPrivateKey();
  return `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;
}

function normalizeFolderPath(folder: string): string {
  const trimmed = folder.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "/";
}

function toImageKitFile(row: ImageKitListItem): ImageKitFile | null {
  if (row.type && row.type !== "file") return null;
  if (!row.fileId || !row.url || !row.filePath) return null;
  return {
    fileId: row.fileId,
    name: row.name ?? "",
    url: row.url,
    size: row.size ?? null,
    filePath: row.filePath,
  };
}

export async function listImageKitFolder(
  folder: string
): Promise<ImageKitFile[]> {
  assertImageKitConfigured();
  const folderPath = normalizeFolderPath(folder);
  const files: ImageKitFile[] = [];
  let skip = 0;
  const limit = 500;

  while (true) {
    const params = new URLSearchParams({
      path: folderPath,
      fileType: "image",
      limit: String(limit),
      skip: String(skip),
      type: "file",
    });

    const res = await fetch(
      `https://api.imagekit.io/v1/files?${params.toString()}`,
      {
        headers: {
          Authorization: imageKitAuthHeader(),
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const json = (await res.json().catch(() => null)) as
      | ImageKitListItem[]
      | { message?: string };

    if (!res.ok) {
      const message =
        json && !Array.isArray(json)
          ? json.message
          : `ImageKit list failed (${res.status})`;
      throw new Error(message ?? `ImageKit list failed (${res.status})`);
    }

    const batch = (Array.isArray(json) ? json : [])
      .map(toImageKitFile)
      .filter((file): file is ImageKitFile => file !== null);
    files.push(...batch);

    if (batch.length < limit) break;
    skip += limit;
    if (skip > 10_000) break;
  }

  return files;
}

export async function deleteImageKitFile(fileId: string): Promise<void> {
  assertImageKitConfigured();
  const res = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: imageKitAuthHeader(),
    },
  });

  if (res.status === 404) return;

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(json.message ?? `ImageKit delete failed (${res.status})`);
  }
}

export function imageKitFilenameFromFile(file: ImageKitFile): string {
  const fromName = file.name?.trim();
  if (fromName) return buildPhotoFilename(fromName);

  const pathPart = file.filePath.split("/").pop() ?? "photo.jpg";
  return buildPhotoFilename(pathPart);
}

export function isImageKitDeliveryUrl(url: string): boolean {
  const endpoint = getImageKitUrlEndpoint();
  if (endpoint && url.startsWith(endpoint)) return true;
  return /https:\/\/ik\.imagekit\.io\//i.test(url);
}

export function imageKitUrlBelongsToFolder(url: string, folder: string): boolean {
  if (!isImageKitDeliveryUrl(url)) return false;
  const endpoint = getImageKitUrlEndpoint();
  if (!endpoint) return false;

  const folderPath = normalizeFolderPath(folder).toLowerCase();
  const relative = url.slice(endpoint.length).replace(/^\//, "").toLowerCase();
  const pathWithoutTransform = relative.replace(/^tr:[^/]+\//, "");
  return (
    pathWithoutTransform === folderPath.replace(/^\//, "") ||
    pathWithoutTransform.startsWith(`${folderPath.replace(/^\//, "")}/`)
  );
}
