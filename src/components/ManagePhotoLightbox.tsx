"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { previewLargeUrl } from "@/lib/mediaUrls";
import type { Photo } from "@/lib/types";

export function ManagePhotoLightbox({
  photo,
  onClose,
}: {
  photo: Photo | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [photo?.id]);

  useEffect(() => {
    if (!photo) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [photo]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-bg-primary/95 backdrop-blur-sm lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${photo.filename}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <p className="min-w-0 truncate text-[13px] text-text-primary">
          {photo.filename}
        </p>
        <Tooltip label="Close preview">
          <IconButton onClick={onClose} label="Close preview">
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </Tooltip>
      </div>
      <div className="relative flex flex-1 items-center justify-center p-4 min-h-0">
        {loading && (
          <Loader2
            className="absolute h-8 w-8 animate-spin text-text-muted"
            aria-hidden
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewLargeUrl(photo.cloudinary_url)}
          alt={photo.filename}
          className="max-h-full max-w-full object-contain"
          onLoad={() => setLoading(false)}
        />
      </div>
      <p className="shrink-0 px-4 pb-4 text-center text-[11px] text-text-muted">
        Long-press photos to select for delete
      </p>
    </div>
  );
}
