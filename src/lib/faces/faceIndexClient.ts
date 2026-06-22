import { UploadCancelledError } from "@/lib/uploadCancelled";
import type { PhotoFaceInput } from "@/lib/faces/types";

const MODEL_BASE_URL = "/models/face-api";

type FaceIndexWorkerResponse = {
  type: "index-result";
  id: number;
  faces: PhotoFaceInput[];
  error?: string;
};

let worker: Worker | null = null;
let nextRequestId = 0;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL("../../workers/faceIndex.worker.ts", import.meta.url)
    );
  }
  return worker;
}

function runFaceIndexOnBuffer(
  buffer: ArrayBuffer,
  signal?: AbortSignal,
  mimeType?: string
): Promise<PhotoFaceInput[]> {
  if (signal?.aborted) {
    return Promise.reject(new UploadCancelledError());
  }

  return new Promise((resolve, reject) => {
    const requestId = ++nextRequestId;
    const faceWorker = getWorker();

    const cleanup = () => {
      faceWorker.removeEventListener("message", onMessage);
      faceWorker.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };

    const onMessage = (event: MessageEvent<FaceIndexWorkerResponse>) => {
      const payload = event.data;
      if (payload.type !== "index-result" || payload.id !== requestId) return;
      cleanup();
      if (payload.error) {
        console.warn("Face indexing failed:", payload.error);
        reject(new Error(payload.error));
        return;
      }
      resolve(payload.faces ?? []);
    };

    const onError = () => {
      cleanup();
      console.warn("Face indexing worker failed");
      resolve([]);
    };

    const onAbort = () => {
      cleanup();
      reject(new UploadCancelledError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
    faceWorker.addEventListener("message", onMessage);
    faceWorker.addEventListener("error", onError, { once: true });

    faceWorker.postMessage(
      {
        type: "index",
        id: requestId,
        buffer,
        mimeType,
        modelBaseUrl: MODEL_BASE_URL,
      },
      [buffer]
    );
  });
}

export function indexFacesFromFile(
  file: File,
  signal?: AbortSignal
): Promise<PhotoFaceInput[]> {
  if (signal?.aborted) {
    return Promise.reject(new UploadCancelledError());
  }

  return file.arrayBuffer().then((buffer) => {
    if (signal?.aborted) {
      throw new UploadCancelledError();
    }
    return runFaceIndexOnBuffer(buffer, signal, file.type || "image/jpeg");
  }).catch((err) => {
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
  return runFaceIndexOnBuffer(buffer, signal, blob.type || "image/jpeg");
}

export function preloadFaceIndexWorker(): void {
  if (typeof window === "undefined") return;
  getWorker();
}
