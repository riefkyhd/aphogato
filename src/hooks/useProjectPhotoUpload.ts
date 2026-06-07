"use client";

import { useCallback, useRef, useState } from "react";
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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const uploadFiles = useCallback(
    async (fileList: FileList | File[] | null) => {
      const files = filterImageUploadFiles(fileList);
      if (files.length === 0) {
        toast.error("No supported image files to upload");
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setUploading(true);
      setUploadedCount(0);
      setCancelDialogOpen(false);
      setProgress({
        currentIndex: 1,
        total: files.length,
        fileName: files[0].name,
        filePercent: 0,
      });

      try {
        const { uploaded, errors, cancelled } = await uploadProjectPhotos(
          projectId,
          files,
          setProgress,
          (photos) => onPhotosUpdated(sortPhotosNewestFirst(photos)),
          controller.signal,
          setUploadedCount
        );

        if (cancelled) {
          toast.info(
            uploaded > 0
              ? `Upload cancelled — ${uploaded} photo${uploaded === 1 ? "" : "s"} kept`
              : "Upload cancelled"
          );
          return;
        }

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
        abortRef.current = null;
        setUploading(false);
        setProgress(null);
        setCancelDialogOpen(false);
        onBatchComplete?.();
      }
    },
    [projectId, onPhotosUpdated, onBatchComplete]
  );

  const requestCancelUpload = useCallback(() => {
    if (!uploading) return;
    setCancelDialogOpen(true);
  }, [uploading]);

  const dismissCancelDialog = useCallback(() => {
    setCancelDialogOpen(false);
  }, []);

  const confirmCancelUpload = useCallback(() => {
    abortRef.current?.abort();
    setCancelDialogOpen(false);
  }, []);

  return {
    uploading,
    progress,
    uploadFiles,
    cancelDialogOpen,
    uploadedCount,
    requestCancelUpload,
    dismissCancelDialog,
    confirmCancelUpload,
  };
}

export type ProjectPhotoUpload = ReturnType<typeof useProjectPhotoUpload>;
