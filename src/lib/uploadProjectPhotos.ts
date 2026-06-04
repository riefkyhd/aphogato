import type { Photo } from "@/lib/types";

export type UploadBatchResult = {
  uploaded: number;
  errors: string[];
  photos: Photo[];
};

export type UploadProgressCallback = (progress: {
  currentIndex: number;
  total: number;
  fileName: string;
  filePercent: number;
}) => void;

function parseUploadResponse(xhr: XMLHttpRequest): UploadBatchResult {
  try {
    return JSON.parse(xhr.responseText) as UploadBatchResult;
  } catch {
    return { uploaded: 0, errors: ["Invalid server response"], photos: [] };
  }
}

/** Upload one file with real XMLHttpRequest byte progress. */
export function uploadProjectPhoto(
  projectId: string,
  file: File,
  onProgress: (filePercent: number) => void
): Promise<{ ok: boolean; result: UploadBatchResult }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("files", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      const result = parseUploadResponse(xhr);
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        result,
      });
    });

    xhr.addEventListener("error", () => {
      resolve({
        ok: false,
        result: {
          uploaded: 0,
          errors: [`${file.name}: network error`],
          photos: [],
        },
      });
    });

    xhr.open("POST", `/api/projects/${projectId}/upload`);
    xhr.send(formData);
  });
}

/** Upload many files sequentially so progress reflects each file and the batch. */
export async function uploadProjectPhotos(
  projectId: string,
  files: File[],
  onProgress: UploadProgressCallback
): Promise<UploadBatchResult> {
  const errors: string[] = [];
  let uploaded = 0;
  let lastPhotos: Photo[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress({
      currentIndex: i + 1,
      total: files.length,
      fileName: file.name,
      filePercent: 0,
    });

    const { ok, result } = await uploadProjectPhoto(
      projectId,
      file,
      (filePercent) => {
        onProgress({
          currentIndex: i + 1,
          total: files.length,
          fileName: file.name,
          filePercent,
        });
      }
    );

    if (result.photos.length > 0) {
      lastPhotos = result.photos;
    }
    uploaded += result.uploaded ?? 0;
    if (result.errors?.length) {
      errors.push(...result.errors);
    }
    if (!ok && (!result.errors || result.errors.length === 0)) {
      errors.push(`${file.name}: upload failed`);
    }

    onProgress({
      currentIndex: i + 1,
      total: files.length,
      fileName: file.name,
      filePercent: 100,
    });
  }

  return { uploaded, errors, photos: lastPhotos };
}
