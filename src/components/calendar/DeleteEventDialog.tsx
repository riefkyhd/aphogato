"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

export function DeleteEventDialog({
  open,
  title,
  wasSynced,
  isGoogleConnected,
  deleting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  wasSynced: boolean;
  isGoogleConnected: boolean;
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-event-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => !deleting && onClose()}
      />
      <div className="relative w-full max-w-md border border-border bg-bg-elevated p-6 shadow-lg">
        <h2
          id="delete-event-title"
          className="text-lg font-light tracking-[0.05em] uppercase text-text-primary"
        >
          Delete event?
        </h2>
        <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
          <span className="text-text-primary">{title}</span> will be removed
          from Aphogato.
          {wasSynced && isGoogleConnected ? (
            <>
              {" "}
              The matching event on your Google Calendar will be deleted too,
              so you can recreate it without duplicates.
            </>
          ) : wasSynced ? (
            <>
              {" "}
              It was synced to Google before; reconnect in Settings and delete
              there manually if it still appears.
            </>
          ) : null}
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
            loading={deleting}
            disabled={deleting}
            className="!bg-status-editing !border-status-editing hover:opacity-90"
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
