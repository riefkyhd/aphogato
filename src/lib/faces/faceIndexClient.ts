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

export function indexFacesFromFile(
  file: File,
  signal?: AbortSignal
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
        console.warn("Face indexing skipped:", payload.error);
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

    void file.arrayBuffer().then((buffer) => {
      if (signal?.aborted) {
        onAbort();
        return;
      }
      faceWorker.postMessage(
        {
          type: "index",
          id: requestId,
          buffer,
          modelBaseUrl: MODEL_BASE_URL,
        },
        [buffer]
      );
    });
  });
}

export function preloadFaceIndexWorker(): void {
  if (typeof window === "undefined") return;
  getWorker();
}
