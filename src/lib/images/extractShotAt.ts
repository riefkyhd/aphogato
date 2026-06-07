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

export async function extractShotAt(
  publicId: string,
  filename: string
): Promise<string | null> {
  try {
    ensureCloudinaryConfigured();
    const resource = (await cloudinary.api.resource(publicId, {
      resource_type: "image",
      image_metadata: true,
    })) as {
      image_metadata?: Record<string, string>;
    };

    const meta = resource.image_metadata;
    const candidates = [
      meta?.DateTimeOriginal,
      meta?.DateTime,
      meta?.CreateDate,
      meta?.DateTimeDigitized,
    ];

    for (const raw of candidates) {
      if (!raw) continue;
      const parsed = parseExifDateTime(raw);
      if (parsed) return parsed;
    }
  } catch {
    // Fall back to filename parsing.
  }

  return parseShotAtFromFilename(filename);
}
