"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import type { Photo } from "@/lib/types";

export function DeletePhotosDialog({
  open,
  photos,
  clientSelectedPhotos,
  deleting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  photos: Photo[];
  clientSelectedPhotos: Photo[];
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

  const hasClientPicks = clientSelectedPhotos.length > 0;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-photos-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md border border-border bg-bg-elevated p-6 shadow-lg">
        <h2
          id="delete-photos-title"
          className="text-lg font-light tracking-[0.05em] uppercase text-text-primary"
        >
          Delete {photos.length} photo{photos.length === 1 ? "" : "s"}?
        </h2>
        <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
          This removes the images from your project and from Cloudinary. This
          cannot be undone.
        </p>
        {hasClientPicks && (
          <div
            className="mt-4 border border-status-editing/40 bg-bg-primary p-3 text-[13px] text-text-primary leading-relaxed"
            role="alert"
          >
            <p className="text-[11px] uppercase tracking-label text-status-editing mb-2">
              Selected by your client
            </p>
            <p>
              {clientSelectedPhotos.length} of the photo
              {clientSelectedPhotos.length === 1 ? "" : "s"} you&rsquo;re
              deleting {clientSelectedPhotos.length === 1 ? "was" : "were"}{" "}
              chosen by your client:
            </p>
            <ul className="mt-2 list-disc pl-4 text-text-secondary max-h-32 overflow-y-auto">
              {clientSelectedPhotos.slice(0, 8).map((ph) => (
                <li key={ph.id} className="truncate">
                  {ph.filename}
                </li>
              ))}
              {clientSelectedPhotos.length > 8 && (
                <li>…and {clientSelectedPhotos.length - 8} more</li>
              )}
            </ul>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
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
