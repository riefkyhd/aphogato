import "server-only";

import {
  computePerceptualHash,
  fetchImageBufferForHashing,
  isPerceptualDuplicate,
} from "@/lib/images/perceptualHash";

export type ImageHashRow = {
  filename: string;
  perceptual_hash: string | null;
};

export function findDuplicateFilename(
  hash: string,
  existing: ImageHashRow[]
): string | null {
  for (const row of existing) {
    if (!row.perceptual_hash) continue;
    if (isPerceptualDuplicate(hash, row.perceptual_hash)) {
      return row.filename;
    }
  }
  return null;
}

export async function computeHashFromBuffer(
  buffer: Buffer
): Promise<string | null> {
  try {
    return await computePerceptualHash(buffer);
  } catch {
    return null;
  }
}

export async function computeHashFromCloudinaryUrl(
  url: string
): Promise<string | null> {
  try {
    const buffer = await fetchImageBufferForHashing(url);
    return await computePerceptualHash(buffer);
  } catch {
    return null;
  }
}

/** Backfill missing hashes so older photos participate in duplicate checks. */
export async function backfillMissingHashes<
  T extends ImageHashRow & { id: string; cloudinary_url: string },
>(
  rows: T[],
  update: (id: string, hash: string) => Promise<void>,
  limit = 12
): Promise<T[]> {
  const updated = [...rows];
  let processed = 0;

  for (let i = 0; i < updated.length && processed < limit; i++) {
    const row = updated[i]!;
    if (row.perceptual_hash) continue;

    const hash = await computeHashFromCloudinaryUrl(row.cloudinary_url);
    if (!hash) continue;

    await update(row.id, hash);
    updated[i] = { ...row, perceptual_hash: hash };
    processed += 1;
  }

  return updated;
}
