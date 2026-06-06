import "server-only";

import sharp from "sharp";

/** 8×8 difference hash (64 bits), hex-encoded. */
const HASH_BITS = 64;
const HASH_GRID = 8;

/** Hamming distance ≤ this ⇒ treated as the same image (re-export, rename, mild resize). */
export const PERCEPTUAL_DUPLICATE_THRESHOLD = 6;

export async function computePerceptualHash(buffer: Buffer): Promise<string> {
  const pixels = await sharp(buffer)
    .rotate()
    .resize(HASH_GRID + 1, HASH_GRID, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  let hash = 0n;
  for (let y = 0; y < HASH_GRID; y++) {
    for (let x = 0; x < HASH_GRID; x++) {
      const left = pixels[y * (HASH_GRID + 1) + x]!;
      const right = pixels[y * (HASH_GRID + 1) + x + 1]!;
      if (left < right) {
        hash |= 1n << BigInt(y * HASH_GRID + x);
      }
    }
  }

  return hash.toString(16).padStart(HASH_BITS / 4, "0");
}

export function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== b.length) return HASH_BITS;
  const xor = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let count = 0;
  let value = xor;
  while (value > 0n) {
    count += Number(value & 1n);
    value >>= 1n;
  }
  return count;
}

export function isPerceptualDuplicate(hash: string, existingHash: string): boolean {
  return hammingDistanceHex(hash, existingHash) <= PERCEPTUAL_DUPLICATE_THRESHOLD;
}

/** Small Cloudinary delivery URL for hashing remote assets without full-resolution download. */
export function cloudinaryUrlForHashing(secureUrl: string): string {
  return secureUrl.replace(
    /\/image\/upload\/(?:[^/]+\/)*/,
    "/image/upload/w_160,h_160,c_limit,q_60/"
  );
}

export async function fetchImageBufferForHashing(url: string): Promise<Buffer> {
  const res = await fetch(cloudinaryUrlForHashing(url), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch image for hashing (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}
