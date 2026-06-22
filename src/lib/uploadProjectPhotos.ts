import { uploadProjectPhotoViaCloudinary } from "@/lib/directCloudinaryClientUpload";
import type { Photo } from "@/lib/types";

export type UploadBatchResult = {
  uploaded: number;
  errors: string[];
  photos: Photo[];
  cancelled?: boolean;
};

export type UploadProgressCallback = (progress: {
  currentIndex: number;
  total: number;
  fileName: string;
  filePercent: number;
  preparing?: boolean;
  indexingFaces?: boolean;
}) => void;

export type UploadProjectPhotoOptions = {
  faceSearchEnabled?: boolean;
};

export type UploadPhotosUpdatedCallback = (photos: Photo[]) => void;

/** Upload one file directly to Cloudinary, then register it in the project. */
export function uploadProjectPhoto(
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
  return uploadProjectPhotoViaCloudinary(
    projectId,
    file,
    onProgress,
    signal,
    options
  );
}

/** Upload many files sequentially so progress reflects each file and the batch. */
export async function uploadProjectPhotos(
  projectId: string,
  files: File[],
  onProgress: UploadProgressCallback,
  onPhotosUpdated?: UploadPhotosUpdatedCallback,
  signal?: AbortSignal,
  onUploadedCountChange?: (count: number) => void,
  options?: UploadProjectPhotoOptions
): Promise<UploadBatchResult> {
  const errors: string[] = [];
  let uploaded = 0;
  let lastPhotos: Photo[] = [];

  for (let i = 0; i < files.length; i++) {
    if (signal?.aborted) {
      return { uploaded, errors, photos: lastPhotos, cancelled: true };
    }

    const file = files[i];
    onProgress({
      currentIndex: i + 1,
      total: files.length,
      fileName: file.name,
      filePercent: 0,
    });

    const { ok, result, cancelled } = await uploadProjectPhoto(
      projectId,
      file,
      (filePercent) => {
        onProgress({
          currentIndex: i + 1,
          total: files.length,
          fileName: file.name,
          filePercent,
          preparing: false,
          indexingFaces: false,
        });
      },
      signal,
      {
        faceSearchEnabled: options?.faceSearchEnabled,
        onPreparing: () => {
          onProgress({
            currentIndex: i + 1,
            total: files.length,
            fileName: file.name,
            filePercent: 0,
            preparing: true,
            indexingFaces: false,
          });
        },
        onIndexingFaces: () => {
          onProgress({
            currentIndex: i + 1,
            total: files.length,
            fileName: file.name,
            filePercent: 0,
            preparing: false,
            indexingFaces: true,
          });
        },
      }
    );

    if (cancelled || signal?.aborted) {
      return { uploaded, errors, photos: lastPhotos, cancelled: true };
    }

    if (result.photos.length > 0) {
      lastPhotos = result.photos;
      if (result.uploaded > 0) {
        onPhotosUpdated?.(result.photos);
      }
    }
    uploaded += result.uploaded ?? 0;
    if (result.uploaded > 0) {
      onUploadedCountChange?.(uploaded);
    }
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
