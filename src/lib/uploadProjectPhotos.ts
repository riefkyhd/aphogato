import { uploadProjectPhotoViaCloudinary } from "@/lib/directCloudinaryClientUpload";
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

/** Upload one file directly to Cloudinary, then register it in the project. */
export function uploadProjectPhoto(
  projectId: string,
  file: File,
  onProgress: (filePercent: number) => void
): Promise<{ ok: boolean; result: UploadBatchResult }> {
  return uploadProjectPhotoViaCloudinary(projectId, file, onProgress);
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
