"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

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
      if (e.key === "Escape" && !deleting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, deleting, onClose]);

  return (
    <ModalShell
      open={open}
      onClose={() => !deleting && onClose()}
      titleId="delete-project-title"
    >
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
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={deleting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          loading={deleting}
          disabled={deleting}
          className="w-full sm:w-auto !bg-status-editing !border-status-editing hover:opacity-90"
        >
          {deleting ? "Deleting…" : "Delete project"}
        </Button>
      </div>
    </ModalShell>
  );
}
