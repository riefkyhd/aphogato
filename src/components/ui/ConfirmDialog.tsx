"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

/**
 * Shared confirmation dialog. Use for any destructive or irreversible
 * action. For 5s-undo flows, prefer a Sonner action toast instead.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirming = false,
  destructive = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  destructive?: boolean;
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

  return (
    <ModalShell open={open} onClose={onClose} titleId="confirm-dialog-title">
      <h2
        id="confirm-dialog-title"
        className="text-lg font-light tracking-[0.05em] uppercase text-text-primary"
      >
        {title}
      </h2>
      <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
        {description}
      </p>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={confirming}
          className="w-full sm:w-auto"
        >
          {cancelLabel}
        </Button>
        <Button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          loading={confirming}
          disabled={confirming}
          className={
            destructive
              ? "w-full sm:w-auto !bg-status-editing !border-status-editing hover:opacity-90"
              : "w-full sm:w-auto"
          }
        >
          {confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
}
