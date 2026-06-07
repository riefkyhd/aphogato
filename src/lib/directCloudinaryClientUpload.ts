import type { Photo, ProjectReference } from "@/lib/types";
import { CLOUDINARY_MAX_UPLOAD_BYTES } from "@/lib/imageUploadLimits";
import { prepareImageForUpload } from "@/lib/prepareImageForUpload";
import { UploadCancelledError } from "@/lib/uploadCancelled";

type UploadBatchResult = {
  uploaded: number;
  errors: string[];
  photos: Photo[];
};

export type SignedCloudinaryUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  assetFolder: string;
  uploadUrl: string;
};

export type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  error?: { message?: string };
};

function uploadErrorMessage(
  fileName: string,
  status: number,
  fallback: string
): string {
  if (status === 413) {
    return `${fileName}: file is too large for Cloudinary (max 10MB after compression)`;
  }
  return `${fileName}: ${fallback}`;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new UploadCancelledError();
  }
}

async function requestUploadSign(
  signUrl: string,
  file: File,
  signal?: AbortSignal
): Promise<SignedCloudinaryUpload> {
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

  let payload: SignedCloudinaryUpload & { error?: string };
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

  if (!response.ok) {
    throw new Error(payload.error ?? `Could not prepare upload (${response.status})`);
  }

  return payload;
}

function uploadFileToCloudinary(
  file: File,
  signed: SignedCloudinaryUpload,
  onProgress: (filePercent: number) => void,
  signal?: AbortSignal
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    throwIfAborted(signal);

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signed.apiKey);
    formData.append("timestamp", String(signed.timestamp));
    formData.append("signature", signed.signature);
    formData.append("public_id", signed.publicId);
    formData.append("asset_folder", signed.assetFolder);
    formData.append("overwrite", "false");

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
      let payload: CloudinaryUploadResponse;
      try {
        payload = JSON.parse(xhr.responseText) as CloudinaryUploadResponse;
      } catch {
        reject(
          new Error(
            uploadErrorMessage(file.name, xhr.status, "invalid Cloudinary response")
          )
        );
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300 || payload.error) {
        reject(
          new Error(
            payload.error?.message ??
              uploadErrorMessage(file.name, xhr.status, "Cloudinary upload failed")
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

async function completeSignedUpload<T>(
  completeUrl: string,
  cloudinaryResult: CloudinaryUploadResponse,
  signal?: AbortSignal
): Promise<T> {
  throwIfAborted(signal);

  const response = await fetch(completeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicId: cloudinaryResult.public_id,
      secureUrl: cloudinaryResult.secure_url,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      bytes: cloudinaryResult.bytes,
      format: cloudinaryResult.format,
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

async function uploadViaSignedCloudinary<T>(
  signUrl: string,
  completeUrl: string,
  file: File,
  onProgress: (filePercent: number) => void,
  signal?: AbortSignal,
  onPreparing?: () => void
): Promise<T> {
  if (file.size > CLOUDINARY_MAX_UPLOAD_BYTES) {
    onPreparing?.();
  }
  const prepared = await prepareImageForUpload(file, signal);
  const signed = await requestUploadSign(signUrl, prepared, signal);
  onProgress(0);
  const cloudinaryResult = await uploadFileToCloudinary(
    prepared,
    signed,
    onProgress,
    signal
  );
  return completeSignedUpload<T>(completeUrl, cloudinaryResult, signal);
}

export async function uploadProjectPhotoViaCloudinary(
  projectId: string,
  file: File,
  onProgress: (filePercent: number) => void,
  signal?: AbortSignal,
  onPreparing?: () => void
): Promise<{ ok: boolean; result: UploadBatchResult; cancelled?: boolean }> {
  try {
    const result = await uploadViaSignedCloudinary<UploadBatchResult>(
      `/api/projects/${projectId}/upload/sign`,
      `/api/projects/${projectId}/upload/complete`,
      file,
      onProgress,
      signal,
      onPreparing
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

export type ReferenceUploadResult = {
  uploaded: number;
  errors: string[];
  references: ProjectReference[];
};

export async function uploadProjectReferenceViaCloudinary(
  projectId: string,
  file: File
): Promise<ReferenceUploadResult> {
  try {
    return await uploadViaSignedCloudinary<ReferenceUploadResult>(
      `/api/projects/${projectId}/references/sign`,
      `/api/projects/${projectId}/references/complete`,
      file,
      () => {}
    );
  } catch (err) {
    return {
      uploaded: 0,
      errors: [err instanceof Error ? err.message : `${file.name}: upload failed`],
      references: [],
    };
  }
}
