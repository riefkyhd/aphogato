const SIGNATURES: Array<{ mime: string; match: (b: Uint8Array) => boolean }> = [
  {
    mime: "image/jpeg",
    match: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    match: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47,
  },
  {
    mime: "image/gif",
    match: (b) =>
      b.length >= 6 &&
      b[0] === 0x47 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x38,
  },
  {
    mime: "image/webp",
    match: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
  {
    mime: "image/heic",
    match: (b) =>
      b.length >= 12 &&
      b[4] === 0x66 &&
      b[5] === 0x74 &&
      b[6] === 0x79 &&
      b[7] === 0x70,
  },
  {
    mime: "image/heif",
    match: (b) =>
      b.length >= 12 &&
      b[4] === 0x66 &&
      b[5] === 0x74 &&
      b[6] === 0x79 &&
      b[7] === 0x70,
  },
];

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export function detectImageMime(buffer: Buffer): string | null {
  const bytes = new Uint8Array(buffer.subarray(0, 32));
  for (const { mime, match } of SIGNATURES) {
    if (match(bytes)) return mime;
  }
  return null;
}

export function isAllowedImageBuffer(
  buffer: Buffer,
  declaredType: string
): boolean {
  const detected = detectImageMime(buffer);
  if (!detected || !ALLOWED_MIMES.has(detected)) return false;
  if (!ALLOWED_MIMES.has(declaredType)) return false;
  if (declaredType === "image/heic" || declaredType === "image/heif") {
    return detected === "image/heic" || detected === "image/heif";
  }
  return detected === declaredType;
}
