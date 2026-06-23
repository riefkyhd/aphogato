import type { Photo } from "@/lib/types";
import { CLOUDINARY_MAX_UPLOAD_BYTES } from "@/lib/imageUploadLimits";
import type { PhotoFaceInput } from "@/lib/faces/types";
import { FEATURES } from "@/lib/features";
import { prepareImageForUpload } from "@/lib/prepareImageForUpload";
import { UploadCancelledError } from "@/lib/uploadCancelled";

type UploadBatchResult = {
  uploaded: number;
  errors: string[];
  photos: Photo[];
};

export type SignedImageKitUpload = {
  provider: "imagekit";
  publicKey: string;
  token: string;
  expire: number;
  signature: string;
  uploadUrl: string;
  folder: string;
  fileName: string;
};

export type ImageKitUploadResponse = {
  fileId: string;
  url: string;
  name?: string;
  size?: number;
  width?: number;
  height?: number;
  message?: string;
};

function uploadErrorMessage(
  fileName: string,
  status: number,
  fallback: string
): string {
  if (status === 413) {
    return `${fileName}: file is too large (max 10MB after compression)`;
  }
  return `${fileName}: ${fallback}`;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new UploadCancelledError();
  }
}

async function requestImageKitUploadSign(
  signUrl: string,
  file: File,
  signal?: AbortSignal
): Promise<SignedImageKitUpload> {
  throwIfAborted(signal);

  const response = await fetch(signUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    }),
    signal,
  });

  let payload: SignedImageKitUpload & { error?: string };
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new Error(
      uploadErrorMessage(
        file.name,
        response.status,
        response.status === 413
          ? "upload request too large — use direct upload"
          : "invalid server response"
      )
    );
  }

  if (!response.ok || payload.provider !== "imagekit") {
    throw new Error(payload.error ?? `Could not prepare upload (${response.status})`);
  }

  return payload;
}

function uploadFileToImageKit(
  file: File,
  signed: SignedImageKitUpload,
  onProgress: (filePercent: number) => void,
  signal?: AbortSignal
): Promise<ImageKitUploadResponse> {
  return new Promise((resolve, reject) => {
    throwIfAborted(signal);

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", signed.fileName);
    formData.append("folder", signed.folder);
    formData.append("publicKey", signed.publicKey);
    formData.append("signature", signed.signature);
    formData.append("expire", String(signed.expire));
    formData.append("token", signed.token);
    formData.append("useUniqueFileName", "false");

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    function cleanup() {
      signal?.removeEventListener("abort", onAbort);
    }

    function onAbort() {
      xhr.abort();
    }

    signal?.addEventListener("abort", onAbort);

    xhr.addEventListener("load", () => {
      cleanup();
      let payload: ImageKitUploadResponse;
      try {
        payload = JSON.parse(xhr.responseText) as ImageKitUploadResponse;
      } catch {
        reject(
          new Error(
            uploadErrorMessage(file.name, xhr.status, "invalid ImageKit response")
          )
        );
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300 || !payload.fileId || !payload.url) {
        reject(
          new Error(
            payload.message ??
              uploadErrorMessage(file.name, xhr.status, "ImageKit upload failed")
          )
        );
        return;
      }

      resolve(payload);
    });

    xhr.addEventListener("error", () => {
      cleanup();
      reject(new Error(`${file.name}: network error`));
    });

    xhr.addEventListener("abort", () => {
      cleanup();
      reject(new UploadCancelledError());
    });

    xhr.open("POST", signed.uploadUrl);
    xhr.send(formData);
  });
}

async function completeImageKitUpload<T>(
  completeUrl: string,
  imageKitResult: ImageKitUploadResponse,
  originalFilename: string,
  signal?: AbortSignal,
  faces: PhotoFaceInput[] = []
): Promise<T> {
  throwIfAborted(signal);

  const response = await fetch(completeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileId: imageKitResult.fileId,
      secureUrl: imageKitResult.url,
      originalFilename,
      width: imageKitResult.width,
      height: imageKitResult.height,
      bytes: imageKitResult.size,
      ...(faces.length > 0 ? { faces } : {}),
    }),
    signal,
  });

  let payload: T & { error?: string };
  try {
    payload = (await response.json()) as T & { error?: string };
  } catch {
    throw new Error(
      response.status === 413
        ? "Upload registration failed: server payload too large"
        : "Invalid server response after upload"
    );
  }

  if (!response.ok) {
    throw new Error(payload.error ?? `Upload registration failed (${response.status})`);
  }

  return payload;
}

type UploadViaSignedImageKitOptions = {
  faceSearchEnabled?: boolean;
  onPreparing?: () => void;
  onIndexingFaces?: () => void;
};

async function uploadViaSignedImageKit<T>(
  signUrl: string,
  completeUrl: string,
  file: File,
  onProgress: (filePercent: number) => void,
  signal?: AbortSignal,
  options?: UploadViaSignedImageKitOptions
): Promise<T> {
  if (file.size > CLOUDINARY_MAX_UPLOAD_BYTES) {
    options?.onPreparing?.();
  }
  const originalFilename = file.name;
  const prepared = await prepareImageForUpload(file, signal);

  const facesPromise =
    FEATURES.faceSearch && options?.faceSearchEnabled
      ? (async () => {
          options.onIndexingFaces?.();
          const { indexFacesFromFile } = await import(
            "@/lib/faces/faceIndexClient"
          );
          return indexFacesFromFile(prepared, signal);
        })()
      : Promise.resolve<PhotoFaceInput[]>([]);

  const uploadPromise = (async () => {
    const signed = await requestImageKitUploadSign(signUrl, prepared, signal);
    onProgress(0);
    return uploadFileToImageKit(prepared, signed, onProgress, signal);
  })();

  const [imageKitResult, faces] = await Promise.all([
    uploadPromise,
    facesPromise,
  ]);

  return completeImageKitUpload<T>(
    completeUrl,
    imageKitResult,
    originalFilename,
    signal,
    faces
  );
}

export async function uploadProjectPhotoViaImageKit(
  projectId: string,
  file: File,
  onProgress: (filePercent: number) => void,
  signal?: AbortSignal,
  options?: {
    onPreparing?: () => void;
    onIndexingFaces?: () => void;
    faceSearchEnabled?: boolean;
  }
): Promise<{ ok: boolean; result: UploadBatchResult; cancelled?: boolean }> {
  try {
    const result = await uploadViaSignedImageKit<UploadBatchResult>(
      `/api/projects/${projectId}/upload/sign`,
      `/api/projects/${projectId}/upload/complete`,
      file,
      onProgress,
      signal,
      {
        faceSearchEnabled: options?.faceSearchEnabled,
        onPreparing: options?.onPreparing,
        onIndexingFaces: options?.onIndexingFaces,
      }
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
        errors: [err instanceof Error ? err.message : `${file.name}: upload failed`],
        photos: [],
      },
    };
  }
}
