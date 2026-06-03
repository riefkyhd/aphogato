import "server-only";

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
  { maxResources = 500 }: { maxResources?: number } = {}
): Promise<CloudinaryResource[]> {
  const normalized = normalizeFolderInput(folder);
  if (!normalized) {
    throw new Error("Folder path is required");
  }

  const byPrefix = await listByPublicIdPrefix(normalized, maxResources);
  if (byPrefix.length > 0) {
    return byPrefix;
  }

  return listByAssetFolder(normalized, maxResources);
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
