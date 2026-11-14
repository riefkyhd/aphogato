"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Maximize2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useImageZoomPan } from "@/hooks/useImageZoomPan";
import { isGDriveUrl } from "@/lib/gdriveUrls";
import { previewLargeUrl } from "@/lib/mediaUrls";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

export type GalleryPhotoZoomLightboxProps = {
  photos: Photo[];
  activePhotoId: string;
  selectedIds: Set<string>;
  onToggleSelect?: (id: string) => void;
  selectionLimitReached?: boolean;
  maxSelection?: number;
  onClose: () => void;
  isSelectionLocked?: boolean;
  activeStage?: "proof" | "final";
};

export function GalleryPhotoZoomLightbox({
  photos,
  activePhotoId,
  selectedIds,
  onToggleSelect,
  selectionLimitReached = false,
  maxSelection,
  onClose,
  isSelectionLocked = false,
  activeStage = "proof",
}: GalleryPhotoZoomLightboxProps) {
  const currentIndex = photos.findIndex((p) => p.id === activePhotoId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentPhoto = photos[safeIndex] ?? null;

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // We manage the active photo inside the lightbox for instant transitions
  const [activeId, setActiveId] = useState(activePhotoId);
  const resolvedIndex = photos.findIndex((p) => p.id === activeId);
  const photo = photos[resolvedIndex >= 0 ? resolvedIndex : 0] ?? currentPhoto;

  const handlePrev = useCallback(() => {
    if (resolvedIndex > 0) {
      const prev = photos[resolvedIndex - 1];
      if (prev) {
        setActiveId(prev.id);
        setLoading(true);
        setFailed(false);
      }
    }
  }, [resolvedIndex, photos]);

  const handleNext = useCallback(() => {
    if (resolvedIndex < photos.length - 1) {
      const next = photos[resolvedIndex + 1];
      if (next) {
        setActiveId(next.id);
        setLoading(true);
        setFailed(false);
      }
    }
  }, [resolvedIndex, photos]);

  const {
    zoom,
    pan,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleQuickZoom,
    zoomPercent,
    isZoomed,
    containerProps,
  } = useImageZoomPan({
    onNavigatePrev: handlePrev,
    onNavigateNext: handleNext,
  });

  // Reset zoom whenever active photo changes
  useEffect(() => {
    resetZoom();
    setLoading(true);
    setFailed(false);
  }, [activeId, resetZoom]);

  // Lock body scroll while modal is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      } else if (e.key === " " || e.key === "s" || e.key === "S") {
        if (photo && onToggleSelect && !isSelectionLocked && activeStage !== "final") {
          e.preventDefault();
          onToggleSelect(photo.id);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onClose,
    handlePrev,
    handleNext,
    zoomIn,
    zoomOut,
    resetZoom,
    photo,
    onToggleSelect,
    isSelectionLocked,
    activeStage,
  ]);

  if (!photo) return null;

  const isSelected = selectedIds.has(photo.id);
  const canSelect = !isSelectionLocked && activeStage === "proof" && onToggleSelect;
  const selectDisabled = selectionLimitReached && !isSelected;

  const downloadTarget =
    isGDriveUrl(photo.cloudinary_url) && photo.id
      ? `/api/media/${encodeURIComponent(photo.id)}?download=1`
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-text-primary backdrop-blur-md select-none touch-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${photo.filename}`}
    >
      {/* Google Drive Style Header Bar */}
      <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-border/40 bg-black/60 px-3 py-2 sm:px-4 sm:py-3 backdrop-blur-sm">
        {/* Left: Close button, Filename, Photo Counter */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview (Esc)"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium tracking-wide text-text-primary max-w-[140px] sm:max-w-xs md:max-w-md">
              {photo.filename}
            </p>
            <p className="text-[10px] uppercase tracking-label text-text-muted">
              {resolvedIndex + 1} of {photos.length}
            </p>
          </div>
        </div>

        {/* Center: Google Drive Zoom Toolbar */}
        <div className="hidden sm:flex items-center gap-1 rounded-sm border border-border/50 bg-bg-elevated/70 px-2 py-1 shadow-inner">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 1.0}
            aria-label="Zoom out (-)"
            className="flex h-7 w-7 items-center justify-center rounded-sm text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
          >
            <ZoomOut className="h-4 w-4" aria-hidden />
          </button>

          <button
            type="button"
            onClick={resetZoom}
            aria-label="Reset zoom (0)"
            className="min-w-[48px] px-1 text-center font-mono text-[11px] text-text-primary hover:text-text-secondary transition-colors"
          >
            {zoomPercent}%
          </button>

          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 4.0}
            aria-label="Zoom in (+)"
            className="flex h-7 w-7 items-center justify-center rounded-sm text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
          >
            <ZoomIn className="h-4 w-4" aria-hidden />
          </button>

          <div className="mx-1 h-3.5 w-px bg-border/60" aria-hidden />

          <button
            type="button"
            onClick={resetZoom}
            aria-label="Fit to screen"
            className="flex h-7 w-7 items-center justify-center rounded-sm text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
            title="Fit to screen (0)"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        {/* Right: Pick / Select Toggle Button & Download */}
        <div className="flex items-center gap-2">
          {activeStage === "final" && downloadTarget ? (
            <a
              href={downloadTarget}
              download={photo.filename}
              aria-label={`Download ${photo.filename}`}
              className="flex h-8 items-center gap-1.5 rounded-sm border border-border/60 bg-bg-elevated/80 px-2.5 text-[12px] text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Download</span>
            </a>
          ) : null}

          {canSelect ? (
            <button
              type="button"
              disabled={selectDisabled}
              title={
                selectDisabled && maxSelection
                  ? `Selection limit of ${maxSelection} reached`
                  : undefined
              }
              onClick={() => onToggleSelect(photo.id)}
              aria-label={isSelected ? `Deselect ${photo.filename}` : `Select ${photo.filename}`}
              aria-pressed={isSelected}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-sm px-3 text-[12px] font-medium tracking-wide transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white",
                isSelected
                  ? "bg-white text-black shadow-md hover:bg-neutral-200"
                  : "border border-border/70 bg-bg-elevated/80 text-text-primary hover:bg-white/10",
                selectDisabled && "cursor-not-allowed opacity-50"
              )}
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  isSelected ? "scale-100" : "scale-75 opacity-60"
                )}
                aria-hidden
              />
              <span>{isSelected ? "Selected" : "Select photo"}</span>
            </button>
          ) : null}
        </div>
      </header>

      {/* Main Interactive Zoom & Pan Canvas */}
      <main
        {...containerProps}
        onDoubleClick={toggleQuickZoom}
        className={cn(
          "relative flex flex-1 items-center justify-center overflow-hidden min-h-0",
          isZoomed
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default"
        )}
      >
        {/* Loading Spinner */}
        {loading && !failed && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-text-muted" aria-hidden />
            <span className="text-[11px] uppercase tracking-label text-text-muted">
              Loading full resolution…
            </span>
          </div>
        )}

        {/* Failed Error Message */}
        {failed ? (
          <div className="text-center px-4">
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Photo preview unavailable.
            </p>
          </div>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.12s ease-out",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewLargeUrl(photo.cloudinary_url)}
              alt={photo.filename}
              draggable={false}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
              className="max-h-full max-w-full object-contain pointer-events-none select-none"
            />
          </div>
        )}

        {/* Floating Navigation Chevrons */}
        {resolvedIndex > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous photo (Left arrow)"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-black/90 hover:text-white transition-all shadow-lg backdrop-blur-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
        ) : null}

        {resolvedIndex < photos.length - 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next photo (Right arrow)"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-black/90 hover:text-white transition-all shadow-lg backdrop-blur-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        ) : null}
      </main>

      {/* Mobile Bottom Bar for Zoom & Navigation Info */}
      <footer className="relative z-20 flex sm:hidden shrink-0 items-center justify-between border-t border-border/40 bg-black/70 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 1.0}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-bg-elevated/70 text-text-primary disabled:opacity-40"
          >
            <ZoomOut className="h-4 w-4" aria-hidden />
          </button>
          <span className="min-w-[44px] text-center font-mono text-[11px] text-text-secondary">
            {zoomPercent}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 4.0}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-bg-elevated/70 text-text-primary disabled:opacity-40"
          >
            <ZoomIn className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            aria-label="Reset zoom"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-sm bg-bg-elevated/70 text-text-primary"
            title="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        <p className="text-[10px] text-text-muted">
          Pinch or double tap to zoom
        </p>
      </footer>
    </div>
  );
}
