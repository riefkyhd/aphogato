import { UploadCancelledError } from "@/lib/uploadCancelled";
import type { PhotoFaceInput } from "@/lib/faces/types";
import {
  detectFacesFromBuffer,
  preloadFaceIndexModels,
} from "@/lib/faces/faceIndexRuntime";

export function indexFacesFromFile(
  file: File,
  signal?: AbortSignal
): Promise<PhotoFaceInput[]> {
  if (signal?.aborted) {
    return Promise.reject(new UploadCancelledError());
  }

  return file
    .arrayBuffer()
    .then((buffer) => {
      if (signal?.aborted) {
        throw new UploadCancelledError();
      }
      return detectFacesFromBuffer(buffer, file.type || "image/jpeg");
    })
    .catch((err) => {
      if (err instanceof UploadCancelledError) throw err;
      console.warn("Face indexing failed:", err);
      return [] as PhotoFaceInput[];
    });
}

export async function indexFacesFromImageUrl(
  imageUrl: string,
  signal?: AbortSignal
): Promise<PhotoFaceInput[]> {
  if (signal?.aborted) {
    throw new UploadCancelledError();
  }

  const response = await fetch(imageUrl, { signal, mode: "cors" });
  if (!response.ok) {
    throw new Error("Could not load photo for face search");
  }
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  if (signal?.aborted) {
    throw new UploadCancelledError();
  }
  return detectFacesFromBuffer(buffer, blob.type || "image/jpeg");
}

export function preloadFaceIndexWorker(): void {
  preloadFaceIndexModels();
}
