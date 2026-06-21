import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryAccount } from "@/lib/cloudinary/accounts";
import {
  parseExifDateTime,
  parseShotAtFromFilename,
} from "@/lib/photoShootingTime";

function ensureCloudinaryConfigured(accountId: string): void {
  const account = getCloudinaryAccount(accountId);
  cloudinary.config({
    cloud_name: account.cloudName,
    api_key: account.apiKey,
    api_secret: account.apiSecret,
  });
}

function metadataValue(
  meta: Record<string, string> | undefined,
  keys: string[]
): string | null {
  if (!meta) return null;
  const byLower = new Map(
    Object.entries(meta).map(([key, value]) => [key.toLowerCase(), value])
  );
  for (const key of keys) {
    const value = byLower.get(key.toLowerCase());
    if (value) return value;
  }
  return null;
}

export async function extractShotAt(
  publicId: string,
  filename: string,
  accountId: string
): Promise<string | null> {
  const fromFilename = parseShotAtFromFilename(filename);
  if (fromFilename) return fromFilename;

  try {
    ensureCloudinaryConfigured(accountId);
    const resource = (await cloudinary.api.resource(publicId, {
      metadata: true,
      image_metadata: true,
    })) as {
      image_metadata?: Record<string, string>;
      metadata?: Record<string, string>;
    };

    const exifDate =
      metadataValue(resource.image_metadata, [
        "DateTimeOriginal",
        "DateTime",
        "CreateDate",
      ]) ??
      metadataValue(resource.metadata, [
        "DateTimeOriginal",
        "DateTime",
        "CreateDate",
      ]);

    if (!exifDate) return null;
    return parseExifDateTime(exifDate);
  } catch {
    return null;
  }
}
