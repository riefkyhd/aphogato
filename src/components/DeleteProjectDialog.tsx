"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

export function DeleteProjectDialog({
  open,
  projectName,
  photoCount,
  deleting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  projectName: string;
  photoCount: number;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-project-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md border border-border bg-bg-elevated p-6 shadow-lg">
        <h2
          id="delete-project-title"
          className="text-lg font-light tracking-[0.05em] uppercase text-text-primary"
        >
          Delete project?
        </h2>
        <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
          <span className="text-text-primary">{projectName}</span> and all{" "}
          {photoCount} photo{photoCount === 1 ? "" : "s"} will be removed from
          Aphogato and Cloudinary. This cannot be undone.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="!bg-status-editing !border-status-editing hover:opacity-90"
          >
            {deleting ? "Deleting…" : "Delete project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
