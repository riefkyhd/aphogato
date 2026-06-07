import {
  ALLOWED_IMAGE_UPLOAD_TYPES,
  CLOUDINARY_MAX_UPLOAD_BYTES,
} from "@/lib/imageUploadLimits";
import { UploadCancelledError } from "@/lib/uploadCancelled";

const MAX_IMAGE_EDGE_PX = 6000;
const OUTPUT_MIME = "image/jpeg";
const INITIAL_JPEG_QUALITY = 0.92;
const MIN_JPEG_QUALITY = 0.5;
const QUALITY_STEP = 0.08;
const DIMENSION_SCALE = 0.85;

const EXTENSION_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new UploadCancelledError();
  }
}

export function resolveImageMimeType(file: File): string | null {
  if (file.type && ALLOWED_IMAGE_UPLOAD_TYPES.has(file.type)) {
    return file.type;
  }
  const match = file.name.toLowerCase().match(/\.[a-z0-9]+$/);
  const ext = match?.[0];
  if (!ext) return null;
  const mime = EXTENSION_MIME[ext];
  return mime && ALLOWED_IMAGE_UPLOAD_TYPES.has(mime) ? mime : null;
}

function withMimeType(file: File, mimeType: string): File {
  if (file.type === mimeType) return file;
  return new File([file], file.name, {
    type: mimeType,
    lastModified: file.lastModified,
  });
}

function scaleToMaxEdge(
  width: number,
  height: number,
  maxEdge: number
): { width: number; height: number } {
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height };
  }
  const ratio = Math.min(maxEdge / width, maxEdge / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode image"));
      },
      mimeType,
      quality
    );
  });
}

async function loadImageBitmap(file: File, signal?: AbortSignal): Promise<ImageBitmap> {
  throwIfAborted(signal);
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error(
      `${file.name}: could not read image — try JPEG or PNG, or export HEIC from your device first`
    );
  }
}

async function compressImageFile(
  file: File,
  signal?: AbortSignal
): Promise<File> {
  const bitmap = await loadImageBitmap(file, signal);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error(`${file.name}: image compression is not supported in this browser`);
  }

  try {
    let { width, height } = scaleToMaxEdge(
      bitmap.width,
      bitmap.height,
      MAX_IMAGE_EDGE_PX
    );

    for (let dimensionPass = 0; dimensionPass < 8; dimensionPass++) {
      throwIfAborted(signal);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(bitmap, 0, 0, width, height);

      for (
        let quality = INITIAL_JPEG_QUALITY;
        quality >= MIN_JPEG_QUALITY;
        quality -= QUALITY_STEP
      ) {
        throwIfAborted(signal);
        const blob = await canvasToBlob(canvas, OUTPUT_MIME, quality);
        if (blob.size <= CLOUDINARY_MAX_UPLOAD_BYTES) {
          return new File([blob], file.name, {
            type: OUTPUT_MIME,
            lastModified: file.lastModified,
          });
        }
      }

      width = Math.max(1, Math.round(width * DIMENSION_SCALE));
      height = Math.max(1, Math.round(height * DIMENSION_SCALE));
    }

    throw new Error(
      `${file.name}: could not compress below 10MB — try a smaller image`
    );
  } finally {
    bitmap.close();
  }
}

/**
 * Ensures an image is within Cloudinary's upload size limit.
 * Large photos are resized and re-encoded as JPEG in the browser before upload.
 */
export async function prepareImageForUpload(
  file: File,
  signal?: AbortSignal
): Promise<File> {
  throwIfAborted(signal);

  const mimeType = resolveImageMimeType(file);
  if (!mimeType) {
    throw new Error(`${file.name}: unsupported file type`);
  }

  const normalized = withMimeType(file, mimeType);

  if (normalized.size <= CLOUDINARY_MAX_UPLOAD_BYTES) {
    return normalized;
  }

  if (mimeType === "image/gif") {
    throw new Error(
      `${file.name}: GIF is too large (max 10MB for upload) — try a smaller file`
    );
  }

  return compressImageFile(normalized, signal);
}
