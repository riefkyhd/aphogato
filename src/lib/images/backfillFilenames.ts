import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryAccount } from "@/lib/cloudinary/accounts";
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

function ensureCloudinaryConfigured(accountId: string): void {
  const account = getCloudinaryAccount(accountId);
  cloudinary.config({
    cloud_name: account.cloudName,
    api_key: account.apiKey,
    api_secret: account.apiSecret,
  });
}

function looksLikeDerivedFilename(
  filename: string,
  publicId: string,
  format?: string | null
): boolean {
  const derived = cloudinaryResourceFilename(publicId, format);
  return filename === derived || filename.toLowerCase() === derived.toLowerCase();
}

async function fetchOriginalFilename(
  publicId: string,
  accountId: string
): Promise<{ originalFilename: string; format?: string | null } | null> {
  try {
    ensureCloudinaryConfigured(accountId);
    const resource = (await cloudinary.api.resource(publicId, {
      metadata: true,
      context: true,
    })) as {
      context?: { custom?: Record<string, string> };
      metadata?: Record<string, string>;
      format?: string;
    };

    const fromContext = resource.context?.custom?.original_filename;
    const fromMetadata = resource.metadata?.original_filename;
    const originalFilename = fromContext || fromMetadata;
    if (!originalFilename) return null;

    return { originalFilename, format: resource.format };
  } catch {
    return null;
  }
}

export async function backfillDerivedFilenames(
  photos: PhotoRow[],
  accountId: string,
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

        const original = await fetchOriginalFilename(publicId, accountId);
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

function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/image\/upload\/(?:[^/]+\/)*v\d+\/(.+)\.[a-z0-9]+$/i);
  if (match) return match[1];
  const alt = url.match(/\/image\/upload\/(?:[^/]+\/)*(.+)\.[a-z0-9]+$/i);
  return alt ? alt[1] : null;
}
