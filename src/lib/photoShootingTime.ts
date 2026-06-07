import type { Photo } from "@/lib/types";

/** EXIF-style "YYYY:MM:DD HH:MM:SS" or ISO-ish strings from Cloudinary metadata. */
export function parseExifDateTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const exifMatch = trimmed.match(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/
  );
  if (exifMatch) {
    const [, y, mo, d, h, mi, s] = exifMatch;
    const date = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s)
    );
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function isoFromParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
): string | null {
  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Best-effort shooting time from common camera filename patterns. */
export function parseShotAtFromFilename(filename: string): string | null {
  const base = filename.replace(/\.[^.]+$/, "");

  const iphone = base.match(
    /(?:^|_)(IMG|PXL|MVIMG)_?(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/i
  );
  if (iphone) {
    return isoFromParts(
      Number(iphone[2]),
      Number(iphone[3]),
      Number(iphone[4]),
      Number(iphone[5]),
      Number(iphone[6]),
      Number(iphone[7])
    );
  }

  const compact = base.match(
    /(?:^|_)(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/
  );
  if (compact) {
    return isoFromParts(
      Number(compact[1]),
      Number(compact[2]),
      Number(compact[3]),
      Number(compact[4]),
      Number(compact[5]),
      Number(compact[6])
    );
  }

  const dashed = base.match(
    /(?:^|_)(\d{4})-(\d{2})-(\d{2})[_ ](\d{2})(\d{2})(\d{2})$/
  );
  if (dashed) {
    return isoFromParts(
      Number(dashed[1]),
      Number(dashed[2]),
      Number(dashed[3]),
      Number(dashed[4]),
      Number(dashed[5]),
      Number(dashed[6])
    );
  }

  return null;
}

export function resolvePhotoShotAt(photo: Photo): string | null {
  if (photo.shot_at) return photo.shot_at;
  return parseShotAtFromFilename(photo.filename);
}
