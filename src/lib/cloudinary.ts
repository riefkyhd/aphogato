import "server-only";
import { v2 as cloudinary } from "cloudinary";

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

function getCloudinaryAuth() {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    throw new Error(
      "Missing Cloudinary env vars (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
    );
  }
  return { cloud, auth: Buffer.from(`${key}:${secret}`).toString("base64") };
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

/** Legacy: public_id starts with folder path (e.g. weddings/client/photo). */
async function listByPublicIdPrefix(
  prefix: string,
  maxResources: number
): Promise<CloudinaryResource[]> {
  const { cloud, auth } = getCloudinaryAuth();
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
  maxResources: number
): Promise<CloudinaryResource[]> {
  const { cloud, auth } = getCloudinaryAuth();
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
  { maxResources = CLOUDINARY_LIST_MAX_RESOURCES }: { maxResources?: number } = {}
): Promise<CloudinaryResource[]> {
  const normalized = normalizeFolderInput(folder);
  if (!normalized) {
    throw new Error("Folder path is required");
  }

  // Merge prefix + asset_folder results. Using only one source misses assets when
  // uploads mix public_id paths with Media Library asset_folder layout.
  const [byPrefix, byFolder] = await Promise.all([
    listByPublicIdPrefix(normalized, maxResources),
    listByAssetFolder(normalized, maxResources),
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

export function previewUrl(publicId: string, width = 600, quality = 70) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/w_${width},q_${quality},f_auto/${publicId}`;
}

export function thumbUrl(publicId: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/w_300,q_60,f_auto/${publicId}`;
}

export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/image\/upload\/(?:[^/]+\/)*v\d+\/(.+)\.[a-z0-9]+$/i);
  if (match) return match[1];
  const alt = url.match(/\/image\/upload\/(?:[^/]+\/)*(.+)\.[a-z0-9]+$/i);
  return alt ? alt[1] : null;
}

function filenameWithoutExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0) return filename;
  return filename.slice(0, lastDot);
}

function ensureCloudinaryConfigured() {
  const { cloud } = getCloudinaryAuth();
  cloudinary.config({
    cloud_name: cloud,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload an image into the project's Cloudinary folder.
 * public_id: `[folder]/[filename-without-extension]`
 *
 * Sets `asset_folder` so assets appear in the Media Library folder tree
 * (required when the product environment uses dynamic folder mode).
 */
export async function uploadImageToFolder(
  folder: string,
  fileBuffer: Buffer,
  originalFilename: string
): Promise<CloudinaryResource> {
  const normalizedFolder = normalizeFolderInput(folder);
  const baseName = filenameWithoutExtension(originalFilename);
  if (!baseName) {
    throw new Error("Invalid filename");
  }

  const publicId = `${normalizedFolder}/${baseName}`;
  ensureCloudinaryConfigured();

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
    filename: `${baseName}.${format}`,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    format,
  };
}

export async function deleteCloudinaryImageByUrl(
  cloudinaryUrl: string
): Promise<void> {
  const publicId = publicIdFromUrl(cloudinaryUrl);
  if (!publicId) {
    throw new Error("Could not determine Cloudinary public ID from URL");
  }
  ensureCloudinaryConfigured();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary delete failed: ${result.result}`);
  }
}
