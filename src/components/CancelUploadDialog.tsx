"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import type { UploadProgressState } from "@/components/PhotoUploadProgress";
import { overallUploadPercent } from "@/components/PhotoUploadProgress";

export function CancelUploadDialog({
  open,
  progress,
  uploadedCount,
  onClose,
  onConfirm,
}: {
  open: boolean;
  progress: UploadProgressState;
  uploadedCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const remaining = Math.max(0, progress.total - progress.currentIndex);
  const overall = overallUploadPercent(progress);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      titleId="cancel-upload-title"
      zClassName="z-[120]"
    >
      <h2
        id="cancel-upload-title"
        className="text-lg font-light tracking-[0.05em] uppercase text-text-primary"
      >
        Cancel upload?
      </h2>
      <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
        The current file will stop uploading and any remaining photos in this
        batch will be skipped.
        {uploadedCount > 0
          ? ` ${uploadedCount} photo${uploadedCount === 1 ? "" : "s"} already uploaded will stay in the project.`
          : " No photos have been added yet."}
      </p>
      <p className="mt-3 text-[13px] text-text-muted">
        Now uploading {progress.currentIndex} of {progress.total}
        {remaining > 0 ? ` · ${remaining} left in this batch` : ""} · {overall}%
        {progress.queuedBatches
          ? ` · ${progress.queuedBatches} more batch${progress.queuedBatches === 1 ? "" : "es"} will upload after`
          : ""}
      </p>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Keep uploading
        </Button>
        <Button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          className="w-full sm:w-auto !bg-status-editing !border-status-editing hover:opacity-90"
        >
          Cancel upload
        </Button>
      </div>
    </ModalShell>
  );
}
