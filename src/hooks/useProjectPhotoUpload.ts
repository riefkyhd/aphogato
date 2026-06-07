"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { UploadProgressState } from "@/components/PhotoUploadProgress";
import { filterImageUploadFiles } from "@/lib/imageUploadFiles";
import { sortPhotosNewestFirst } from "@/lib/sortPhotos";
import { uploadProjectPhotos } from "@/lib/uploadProjectPhotos";
import type { Photo } from "@/lib/types";

export function useProjectPhotoUpload(
  projectId: string,
  onPhotosUpdated: (photos: Photo[]) => void,
  onBatchComplete?: () => void
) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgressState | null>(null);

  const uploadFiles = useCallback(
    async (fileList: FileList | File[] | null) => {
      const files = filterImageUploadFiles(fileList);
      if (files.length === 0) {
        toast.error("No supported image files to upload");
        return;
      }

      setUploading(true);
      setProgress({
        currentIndex: 1,
        total: files.length,
        fileName: files[0].name,
        filePercent: 0,
      });

      try {
        const { uploaded, errors } = await uploadProjectPhotos(
          projectId,
          files,
          setProgress,
          (photos) => onPhotosUpdated(sortPhotosNewestFirst(photos))
        );

        if (uploaded > 0) {
          toast.success(
            `Uploaded ${uploaded} photo${uploaded === 1 ? "" : "s"}`
          );
        }
        if (errors.length > 0) {
          toast.warning(
            errors.length === 1
              ? errors[0]
              : `${errors.length} files failed — ${errors.slice(0, 2).join("; ")}${errors.length > 2 ? "…" : ""}`
          );
        }
        if (uploaded === 0 && errors.length === 0) {
          toast.error("Upload failed");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        setProgress(null);
        onBatchComplete?.();
      }
    },
    [projectId, onPhotosUpdated, onBatchComplete]
  );

  return { uploading, progress, uploadFiles };
}

export type ProjectPhotoUpload = ReturnType<typeof useProjectPhotoUpload>;
