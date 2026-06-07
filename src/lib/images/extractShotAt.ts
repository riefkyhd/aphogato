import "server-only";
import { v2 as cloudinary } from "cloudinary";
import {
  parseExifDateTime,
  parseShotAtFromFilename,
} from "@/lib/photoShootingTime";

function ensureCloudinaryConfigured(): void {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    throw new Error("Missing Cloudinary env vars");
  }
  cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret });
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
    if (value?.trim()) return value.trim();
  }
  return null;
}

const EXIF_DATE_KEYS = [
  "DateTimeOriginal",
  "Date Time Original",
  "DateTime",
  "CreateDate",
  "DateTimeDigitized",
  "Date Time Digitized",
  "SubSecTimeOriginal",
];

export async function extractShotAt(
  publicId: string,
  filename: string
): Promise<string | null> {
  try {
    ensureCloudinaryConfigured();
    const resource = (await cloudinary.api.resource(publicId, {
      resource_type: "image",
      image_metadata: true,
      colors: false,
      faces: false,
      quality_analysis: false,
      accessibility_analysis: false,
      cinemagraph_analysis: false,
    })) as {
      image_metadata?: Record<string, string>;
    };

    const raw = metadataValue(resource.image_metadata, EXIF_DATE_KEYS);
    if (raw) {
      const parsed = parseExifDateTime(raw);
      if (parsed) return parsed;
    }
  } catch {
    // Fall back to filename parsing.
  }

  return parseShotAtFromFilename(filename);
}
