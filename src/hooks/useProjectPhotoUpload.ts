"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { UploadProgressState } from "@/components/PhotoUploadProgress";
import { filterImageUploadFiles } from "@/lib/imageUploadFiles";
import { uploadProjectPhotos } from "@/lib/uploadProjectPhotos";
import type { Photo } from "@/lib/types";
import type { StorageProvider } from "@/lib/storage/provider";

type UploadJob = {
  files: File[];
  controller: AbortController;
};

export function useProjectPhotoUpload(
  projectId: string,
  onPhotosUpdated: (photos: Photo[]) => void,
  onBatchComplete?: () => void,
  faceSearchEnabled = false,
  storageProvider: StorageProvider = "cloudinary"
) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgressState | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const queueRef = useRef<UploadJob[]>([]);
  const workerActiveRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const faceSearchEnabledRef = useRef(faceSearchEnabled);
  faceSearchEnabledRef.current = faceSearchEnabled;
  const storageProviderRef = useRef(storageProvider);
  storageProviderRef.current = storageProvider;

  const updateQueuedBatches = useCallback((count: number) => {
    setProgress((current) =>
      current ? { ...current, queuedBatches: count } : current
    );
  }, []);

  const drainQueue = useCallback(async () => {
    if (workerActiveRef.current) return;
    workerActiveRef.current = true;
    setUploading(true);

    while (queueRef.current.length > 0) {
      const job = queueRef.current[0];
      const queuedBatches = Math.max(0, queueRef.current.length - 1);

      abortRef.current = job.controller;
      setUploadedCount(0);
      setProgress({
        currentIndex: 1,
        total: job.files.length,
        fileName: job.files[0].name,
        filePercent: 0,
        queuedBatches,
      });

      try {
        const { uploaded, errors, cancelled } = await uploadProjectPhotos(
          projectId,
          job.files,
          (next) => {
            setProgress({ ...next, queuedBatches });
          },
          (photos) => onPhotosUpdated(photos),
          job.controller.signal,
          setUploadedCount,
          { faceSearchEnabled: faceSearchEnabledRef.current, storageProvider: storageProviderRef.current }
        );

        if (cancelled) {
          toast.info(
            uploaded > 0
              ? `Upload cancelled — ${uploaded} photo${uploaded === 1 ? "" : "s"} kept`
              : "Upload cancelled"
          );
        } else {
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
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        queueRef.current.shift();
        onBatchComplete?.();
      }
    }

    workerActiveRef.current = false;
    abortRef.current = null;
    setUploading(false);
    setProgress(null);
    setCancelDialogOpen(false);
  }, [projectId, onPhotosUpdated, onBatchComplete]);

  const uploadFiles = useCallback(
    (fileList: FileList | File[] | null) => {
      const files = filterImageUploadFiles(fileList);
      if (files.length === 0) {
        toast.error("No supported image files to upload");
        return;
      }

      const wasActive = workerActiveRef.current || queueRef.current.length > 0;
      queueRef.current.push({
        files,
        controller: new AbortController(),
      });

      if (wasActive) {
        const waiting = Math.max(0, queueRef.current.length - 1);
        updateQueuedBatches(waiting);
        toast.info(
          `Added ${files.length} photo${files.length === 1 ? "" : "s"} — ${waiting} batch${waiting === 1 ? "" : "es"} queued`
        );
      }

      void drainQueue();
    },
    [drainQueue, updateQueuedBatches]
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
