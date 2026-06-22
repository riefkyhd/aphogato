"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { galleryGridImageUrl } from "@/lib/cloudinaryUrls";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD_PX = 48;

export function GalleryPhotoLightbox({
  photos,
  index,
  selectedIds,
  selectionLimitReached,
  onToggleSelect,
  onClose,
  onIndexChange,
}: {
  photos: Photo[];
  index: number;
  selectedIds: Set<string>;
  selectionLimitReached: boolean;
  onToggleSelect: (id: string) => void;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const photo = photos[index] ?? null;
  const [loading, setLoading] = useState(true);
  const touchRef = useRef<{ startX: number } | null>(null);

  const isSelected = photo ? selectedIds.has(photo.id) : false;
  const selectBlocked = selectionLimitReached && !isSelected;
  const canGoPrev = index > 0;
  const canGoNext = index < photos.length - 1;

  useEffect(() => {
    setLoading(true);
  }, [photo?.id]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const goPrev = useCallback(() => {
    if (canGoPrev) onIndexChange(index - 1);
  }, [canGoPrev, index, onIndexChange]);

  const goNext = useCallback(() => {
    if (canGoNext) onIndexChange(index + 1);
  }, [canGoNext, index, onIndexChange]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, goPrev, goNext]);

  if (!photo) return null;

  const previewSrc = galleryGridImageUrl(photo.cloudinary_url);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-bg-primary/98 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${photo.filename}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <p className="min-w-0 flex-1 truncate text-[13px] text-text-primary">
          {photo.filename}
        </p>
        <span className="shrink-0 text-[11px] tabular-nums text-text-muted">
          {index + 1} / {photos.length}
        </span>
        <IconButton onClick={onClose} label="Close preview">
          <X className="h-5 w-5" aria-hidden />
        </IconButton>
      </div>

      <div
        className="relative flex flex-1 min-h-0 items-center justify-center px-2 sm:px-6"
        onTouchStart={(e) => {
          touchRef.current = { startX: e.touches[0]?.clientX ?? 0 };
        }}
        onTouchEnd={(e) => {
          const start = touchRef.current?.startX;
          touchRef.current = null;
          if (start === undefined) return;
          const endX = e.changedTouches[0]?.clientX ?? start;
          const delta = endX - start;
          if (delta <= -SWIPE_THRESHOLD_PX) goNext();
          else if (delta >= SWIPE_THRESHOLD_PX) goPrev();
        }}
      >
        {canGoPrev ? (
          <button
            type="button"
            className="absolute left-1 sm:left-3 z-10 flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-bg-secondary/90 text-text-primary hover:bg-bg-elevated transition-colors"
            aria-label="Previous photo"
            onClick={goPrev}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : null}

        <div className="relative flex h-full w-full max-w-4xl items-center justify-center p-2 sm:p-4">
          {loading ? (
            <Loader2
              className="absolute h-8 w-8 animate-spin text-text-muted"
              aria-hidden
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={photo.id}
            src={previewSrc}
            alt={photo.filename}
            className={cn(
              "max-h-full max-w-full object-contain transition-opacity",
              loading ? "opacity-0" : "opacity-100",
              isSelected && "ring-2 ring-text-primary ring-offset-2 ring-offset-bg-primary"
            )}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        </div>

        {canGoNext ? (
          <button
            type="button"
            className="absolute right-1 sm:right-3 z-10 flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-bg-secondary/90 text-text-primary hover:bg-bg-elevated transition-colors"
            aria-label="Next photo"
            onClick={goNext}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant={isSelected ? "secondary" : "primary"}
          className="w-full"
          disabled={selectBlocked}
          onClick={() => onToggleSelect(photo.id)}
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              Selected — tap to remove
            </>
          ) : selectBlocked ? (
            "Selection limit reached"
          ) : (
            "Select for editing"
          )}
        </Button>
        <p className="mt-2 text-center text-[11px] text-text-muted">
          Swipe or use arrows to browse
        </p>
      </div>
    </div>
  );
}
