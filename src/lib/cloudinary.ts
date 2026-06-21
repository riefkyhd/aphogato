import "server-only";
import { v2 as cloudinary } from "cloudinary";
import {
  getCloudinaryAccount,
  getCloudinaryAuth,
  resolveAccountIdForUrl,
} from "@/lib/cloudinary/accounts";
import {
  buildPhotoFilename,
  sanitizeCloudinaryBasename,
} from "@/lib/cloudinary/filenames";

/** Safety cap when listing a project folder (Cloudinary paginates 100 per request). */
export const CLOUDINARY_LIST_MAX_RESOURCES = 10_000;

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  filename: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}

interface CloudinaryListResponse {
  resources: Array<{
    asset_id?: string;
    public_id: string;
    secure_url: string;
    width?: number;
    height?: number;
    bytes?: number;
    format?: string;
  }>;
  next_cursor?: string;
}

interface CloudinarySearchResponse {
  resources: Array<{
    public_id: string;
    secure_url: string;
    width?: number;
    height?: number;
    bytes?: number;
    format?: string;
  }>;
  next_cursor?: string;
  total_count?: number;
}

function normalizeFolderInput(folder: string): string {
  return folder.trim().replace(/^\/+|\/+$/g, "");
}

function toResource(
  r: CloudinaryListResponse["resources"][number]
): CloudinaryResource {
  const parts = r.public_id.split("/");
  const filename = `${parts[parts.length - 1]}.${r.format ?? "jpg"}`;
  return {
    public_id: r.public_id,
    secure_url: r.secure_url,
    filename,
    width: r.width,
    height: r.height,
    bytes: r.bytes,
    format: r.format,
  };
}

function ensureCloudinaryConfigured(accountId: string) {
  const account = getCloudinaryAccount(accountId);
  cloudinary.config({
    cloud_name: account.cloudName,
    api_key: account.apiKey,
    api_secret: account.apiSecret,
  });
}

/** Legacy: public_id starts with folder path (e.g. weddings/client/photo). */
async function listByPublicIdPrefix(
  prefix: string,
  accountId: string,
  maxResources: number
): Promise<CloudinaryResource[]> {
  const { cloud, auth } = getCloudinaryAuth(accountId);
  const out: CloudinaryResource[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(
      `https://api.cloudinary.com/v1_1/${cloud}/resources/image`
    );
    url.searchParams.set("prefix", prefix);
    url.searchParams.set("type", "upload");
    url.searchParams.set("max_results", "100");
    if (cursor) url.searchParams.set("next_cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Cloudinary list failed: ${res.status} ${res.statusText} — ${body}`
      );
    }

    const json = (await res.json()) as CloudinaryListResponse;
    for (const r of json.resources) {
      out.push(toResource(r));
      if (out.length >= maxResources) return out;
    }
    cursor = json.next_cursor;
  } while (cursor);

  return out;
}

/**
 * Media Library folders (asset_folder) — public_id often has no folder segment.
 * Uses the Search API: asset_folder:"Katherine"
 */
async function listByAssetFolder(
  folder: string,
  accountId: string,
  maxResources: number
): Promise<CloudinaryResource[]> {
  const { cloud, auth } = getCloudinaryAuth(accountId);
  const escaped = folder.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const expression = `asset_folder:"${escaped}"`;
  const out: CloudinaryResource[] = [];
  let cursor: string | undefined;

  do {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/resources/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expression,
          max_results: Math.min(100, maxResources - out.length),
          next_cursor: cursor,
        }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Cloudinary search failed: ${res.status} ${res.statusText} — ${body}`
      );
    }

    const json = (await res.json()) as CloudinarySearchResponse;
    for (const r of json.resources ?? []) {
      out.push(toResource(r));
      if (out.length >= maxResources) return out;
    }
    cursor = json.next_cursor;
  } while (cursor && out.length < maxResources);

  return out;
}

/**
 * List images in a Cloudinary folder. Supports:
 * - Classic folder-in-public_id (prefix `weddings/client`)
 * - Media Library asset_folder (UI folder name only, e.g. `Katherine`)
 */
export async function listFolder(
  folder: string,
  accountId: string,
  { maxResources = CLOUDINARY_LIST_MAX_RESOURCES }: { maxResources?: number } = {}
): Promise<CloudinaryResource[]> {
  const normalized = normalizeFolderInput(folder);
  if (!normalized) {
    throw new Error("Folder path is required");
  }

  const [byPrefix, byFolder] = await Promise.all([
    listByPublicIdPrefix(normalized, accountId, maxResources),
    listByAssetFolder(normalized, accountId, maxResources),
  ]);

  const merged = new Map<string, CloudinaryResource>();
  for (const resource of [...byPrefix, ...byFolder]) {
    merged.set(resource.public_id, resource);
  }

  const all = Array.from(merged.values());
  if (all.length > maxResources) {
    return all.slice(0, maxResources);
  }
  return all;
}

export function previewUrl(
  publicId: string,
  accountId: string,
  width = 600,
  quality = 70
) {
  const { cloud } = getCloudinaryAuth(accountId);
  return `https://res.cloudinary.com/${cloud}/image/upload/w_${width},q_${quality},f_auto/${publicId}`;
}

export function thumbUrl(publicId: string, accountId: string) {
  const { cloud } = getCloudinaryAuth(accountId);
  return `https://res.cloudinary.com/${cloud}/image/upload/w_300,q_60,f_auto/${publicId}`;
}

export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/image\/upload\/(?:[^/]+\/)*v\d+\/(.+)\.[a-z0-9]+$/i);
  if (match) return match[1];
  const alt = url.match(/\/image\/upload\/(?:[^/]+\/)*(.+)\.[a-z0-9]+$/i);
  return alt ? alt[1] : null;
}

/**
 * Upload an image into the project's Cloudinary folder.
 * public_id: `[folder]/[filename-without-extension]`
 */
export async function uploadImageToFolder(
  folder: string,
  fileBuffer: Buffer,
  originalFilename: string,
  accountId: string
): Promise<CloudinaryResource> {
  const normalizedFolder = normalizeFolderInput(folder);
  const publicId = sanitizeCloudinaryBasename(originalFilename);
  if (!publicId) {
    throw new Error("Invalid filename");
  }

  ensureCloudinaryConfigured(accountId);

  const result = await new Promise<{
    public_id: string;
    secure_url: string;
    format?: string;
    width?: number;
    height?: number;
    bytes?: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        asset_folder: normalizedFolder,
        use_asset_folder_as_public_id_prefix: true,
        overwrite: false,
        resource_type: "image",
      },
      (error, uploadResult) => {
        if (error) reject(error);
        else if (!uploadResult) reject(new Error("Upload failed"));
        else resolve(uploadResult);
      }
    );
    stream.end(fileBuffer);
  });

  const format = result.format ?? "jpg";
  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    filename: buildPhotoFilename(originalFilename, format),
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    format,
  };
}

function replaceFolderInPublicId(
  publicId: string,
  oldFolder: string,
  newFolder: string
): string {
  const oldNorm = normalizeFolderInput(oldFolder);
  const newNorm = normalizeFolderInput(newFolder);
  if (publicId === oldNorm) return newNorm;
  if (publicId.startsWith(`${oldNorm}/`)) {
    return `${newNorm}${publicId.slice(oldNorm.length)}`;
  }
  return `${newNorm}/${publicId}`;
}

export function migrateCloudinaryUrlForFolderRename(
  url: string,
  oldFolder: string,
  newFolder: string
): string {
  const oldNorm = normalizeFolderInput(oldFolder);
  const newNorm = normalizeFolderInput(newFolder);
  const idx = url.indexOf(oldNorm);
  if (idx === -1) return url;
  return url.slice(0, idx) + newNorm + url.slice(idx + oldNorm.length);
}

/** Rename a Media Library folder and all assets inside (including subfolders). */
export async function renameCloudinaryFolder(
  oldFolder: string,
  newFolder: string,
  accountId: string
): Promise<void> {
  const oldNorm = normalizeFolderInput(oldFolder);
  const newNorm = normalizeFolderInput(newFolder);
  if (oldNorm === newNorm) return;

  ensureCloudinaryConfigured(accountId);

  try {
    await cloudinary.api.rename_folder(oldNorm, newNorm);
  } catch (folderErr) {
    await renameCloudinaryFolderByAssets(oldNorm, newNorm, folderErr, accountId);
  }
}

async function renameCloudinaryFolderByAssets(
  oldNorm: string,
  newNorm: string,
  folderErr: unknown,
  accountId: string
): Promise<void> {
  const resources = await listFolder(oldNorm, accountId);
  let referenceResources: CloudinaryResource[] = [];
  try {
    referenceResources = await listFolder(`${oldNorm}/references`, accountId);
  } catch {
    // No references folder yet.
  }

  const all = [...resources, ...referenceResources];
  if (all.length === 0) {
    const message =
      folderErr instanceof Error ? folderErr.message : "Folder rename failed";
    throw new Error(message);
  }

  for (const resource of all) {
    const isReference = resource.public_id.includes("/references/");
    const targetFolder = isReference ? `${newNorm}/references` : newNorm;
    const newPublicId = replaceFolderInPublicId(
      resource.public_id,
      oldNorm,
      newNorm
    );

    await cloudinary.uploader.rename(
      resource.public_id,
      newPublicId,
      {
        resource_type: "image",
        overwrite: false,
        asset_folder: targetFolder,
      } as unknown as Parameters<typeof cloudinary.uploader.rename>[2]
    );
  }
}

export async function deleteCloudinaryImageByUrl(
  cloudinaryUrl: string
): Promise<void> {
  const publicId = publicIdFromUrl(cloudinaryUrl);
  if (!publicId) {
    throw new Error("Could not determine Cloudinary public ID from URL");
  }
  const accountId = resolveAccountIdForUrl(cloudinaryUrl);
  ensureCloudinaryConfigured(accountId);
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary delete failed: ${result.result}`);
  }
}
