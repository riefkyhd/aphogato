import type { Photo, PhotoStage } from "@/lib/types";
import type { PhotoFaceInput } from "@/lib/faces/types";
import { FEATURES } from "@/lib/features";
import { UploadCancelledError } from "@/lib/uploadCancelled";

type UploadBatchResult = {
  uploaded: number;
  errors: string[];
  photos: Photo[];
};

export type SignedGDriveUpload = {
  provider: "gdrive";
  uploadUrl: string;
  fileName: string;
  stage: PhotoStage;
};

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new UploadCancelledError();
  }
}

async function requestGDriveUploadSign(
  signUrl: string,
  file: File,
  stage: PhotoStage = "proof",
  signal?: AbortSignal
): Promise<SignedGDriveUpload> {
  throwIfAborted(signal);

  const response = await fetch(signUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type || "image/jpeg",
      size: file.size,
      stage,
    }),
    signal,
  });

  const payload = (await response.json()) as SignedGDriveUpload & {
    error?: string;
  };
  if (!response.ok || payload.provider !== "gdrive" || !payload.uploadUrl) {
    throw new Error(payload.error ?? "Failed to initialize Google Drive upload");
  }

  return payload;
}

function uploadFileToGDrive(
  file: File,
  uploadUrl: string,
  onProgress: (filePercent: number) => void,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadCancelledError());
      return;
    }

    const xhr = new XMLHttpRequest();

    const onAbort = () => {
      xhr.abort();
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
    };

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      const percent = Math.min(
        100,
        Math.max(0, Math.round((event.loaded / event.total) * 100))
      );
      onProgress(percent);
    });

    xhr.addEventListener("load", () => {
      cleanup();
      // Google Drive resumable upload returns 200 or 201 on completion with JSON body containing file metadata (id)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as { id?: string };
          if (json.id) {
            resolve(json.id);
            return;
          }
        } catch {
          // fallback if response text not JSON
        }
        resolve("");
        return;
      }

      reject(
        new Error(
          `${file.name}: Google Drive upload failed (${xhr.status} ${xhr.statusText})`
        )
      );
    });

    xhr.addEventListener("error", () => {
      cleanup();
      reject(new Error(`${file.name}: network error during Google Drive upload`));
    });

    xhr.addEventListener("abort", () => {
      cleanup();
      reject(new UploadCancelledError());
    });

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
    xhr.send(file);
  });
}

async function completeGDriveUpload(
  completeUrl: string,
  fileId: string,
  originalFilename: string,
  stage: PhotoStage,
  signal?: AbortSignal,
  faces: PhotoFaceInput[] = []
): Promise<UploadBatchResult> {
  throwIfAborted(signal);

  const response = await fetch(completeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileId,
      originalFilename,
      stage,
      ...(faces.length > 0 ? { faces } : {}),
    }),
    signal,
  });

  const payload = (await response.json()) as UploadBatchResult & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(
      payload.error ?? `Upload registration failed (${response.status})`
    );
  }

  return payload;
}

export async function uploadProjectPhotoViaGDrive(
  projectId: string,
  file: File,
  onProgress: (filePercent: number) => void,
  signal?: AbortSignal,
  options?: {
    faceSearchEnabled?: boolean;
    stage?: PhotoStage;
    onIndexingFaces?: () => void;
  }
): Promise<{ ok: boolean; result: UploadBatchResult; cancelled?: boolean }> {
  try {
    const stage = options?.stage ?? "proof";
    const signUrl = `/api/projects/${projectId}/upload/sign`;
    const completeUrl = `/api/projects/${projectId}/upload/complete`;

    const signed = await requestGDriveUploadSign(signUrl, file, stage, signal);
    onProgress(0);

    const facesPromise =
      FEATURES.faceSearch && options?.faceSearchEnabled
        ? (async () => {
            options.onIndexingFaces?.();
            const { indexFacesFromFile } = await import(
              "@/lib/faces/faceIndexClient"
            );
            return indexFacesFromFile(file, signal);
          })()
        : Promise.resolve<PhotoFaceInput[]>([]);

    const uploadPromise = uploadFileToGDrive(
      file,
      signed.uploadUrl,
      onProgress,
      signal
    );

    const [fileId, faces] = await Promise.all([uploadPromise, facesPromise]);

    const result = await completeGDriveUpload(
      completeUrl,
      fileId,
      file.name,
      stage,
      signal,
      faces
    );

    return { ok: true, result };
  } catch (err) {
    if (err instanceof UploadCancelledError) {
      return {
        ok: false,
        cancelled: true,
        result: { uploaded: 0, errors: [], photos: [] },
      };
    }
    return {
      ok: false,
      result: {
        uploaded: 0,
        errors: [
          err instanceof Error
            ? err.message
            : `${file.name}: Google Drive upload failed`,
        ],
        photos: [],
      },
    };
  }
}
