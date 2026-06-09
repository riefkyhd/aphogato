import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { publicIdFromUrl } from "@/lib/cloudinary";
import {
  buildPhotoFilename,
  cloudinaryResourceFilename,
} from "@/lib/cloudinary/filenames";

type PhotoRow = {
  id: string;
  filename: string;
  cloudinary_url: string;
};

const BATCH_SIZE = 8;

function ensureCloudinaryConfigured(): void {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    throw new Error("Missing Cloudinary env vars");
  }
  cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret });
}

function looksLikeDerivedFilename(
  filename: string,
  publicId: string,
  format?: string | null
): boolean {
  const derived = cloudinaryResourceFilename(publicId, format);
  return (
    filename === derived ||
    filename.toLowerCase() === derived.toLowerCase()
  );
}

async function fetchOriginalFilename(
  publicId: string
): Promise<{ originalFilename: string; format?: string } | null> {
  try {
    ensureCloudinaryConfigured();
    const resource = (await cloudinary.api.resource(publicId, {
      resource_type: "image",
    })) as {
      original_filename?: string;
      format?: string;
    };
    if (!resource.original_filename?.trim()) return null;
    return {
      originalFilename: resource.original_filename.trim(),
      format: resource.format,
    };
  } catch {
    return null;
  }
}

export async function backfillDerivedFilenames(
  photos: PhotoRow[],
  update: (id: string, filename: string) => Promise<void>
): Promise<number> {
  const usedFilenames = new Set(photos.map((photo) => photo.filename));
  const usedFilenamesLower = new Set(
    photos.map((photo) => photo.filename.toLowerCase())
  );
  let updated = 0;

  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const batch = photos.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (photo) => {
        const publicId = publicIdFromUrl(photo.cloudinary_url);
        if (!publicId) return false;

        const ext = photo.filename.split(".").pop()?.toLowerCase();
        if (!looksLikeDerivedFilename(photo.filename, publicId, ext)) {
          return false;
        }

        const original = await fetchOriginalFilename(publicId);
        if (!original) return false;

        const candidate = buildPhotoFilename(
          original.originalFilename,
          original.format ?? ext
        );
        if (
          candidate === photo.filename ||
          candidate.toLowerCase() === photo.filename.toLowerCase()
        ) {
          return false;
        }
        if (
          usedFilenames.has(candidate) ||
          usedFilenamesLower.has(candidate.toLowerCase())
        ) {
          return false;
        }

        await update(photo.id, candidate);
        usedFilenames.delete(photo.filename);
        usedFilenamesLower.delete(photo.filename.toLowerCase());
        usedFilenames.add(candidate);
        usedFilenamesLower.add(candidate.toLowerCase());
        return true;
      })
    );

    updated += results.filter(Boolean).length;
  }

  return updated;
}
