"use client";

import { Download, ZoomIn } from "lucide-react";
import { MasonryPhoto } from "@/components/MasonryPhoto";
import { SelectionOverlay } from "@/components/SelectionOverlay";
import { useColumnCount } from "@/hooks/useColumnCount";
import { isGDriveUrl } from "@/lib/gdriveUrls";
import { cn } from "@/lib/utils";

export function GalleryPhotoCell({
  photoId,
  cloudinaryUrl,
  filename,
  selected,
  selectDisabled = false,
  isFinal = false,
  onToggle,
  onOpenZoom,
}: {
  photoId?: string;
  cloudinaryUrl: string;
  filename: string;
  selected: boolean;
  selectDisabled?: boolean;
  isFinal?: boolean;
  onToggle: () => void;
  onOpenZoom?: () => void;
}) {
  const columnCount = useColumnCount("gallery");

  const downloadTarget =
    isGDriveUrl(cloudinaryUrl) && photoId
      ? `/api/media/${encodeURIComponent(photoId)}?download=1`
      : null;

  function handleCellClick() {
    if (onOpenZoom) {
      onOpenZoom();
    } else {
      if (!selectDisabled) onToggle();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCellClick();
    }
  }

  return (
    <div className="group relative w-full [content-visibility:auto] [contain-intrinsic-size:auto_280px]">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open preview and zoom for ${filename}`}
        onClick={handleCellClick}
        onKeyDown={handleKeyDown}
        className="relative w-full cursor-pointer touch-manipulation overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
      >
        <MasonryPhoto
          src={cloudinaryUrl}
          alt={filename}
          variant="gallery"
          galleryColumnCount={columnCount}
          className="pointer-events-none select-none transition duration-200 group-hover:brightness-105"
        />

        {/* Selected Overlay Border */}
        {selected ? <SelectionOverlay /> : null}

        {/* Dedicated Select Button in Top-Right Corner */}
        <button
          type="button"
          disabled={selectDisabled}
          aria-label={selected ? `Deselect ${filename}` : `Select ${filename}`}
          aria-pressed={selected}
          onClick={(e) => {
            e.stopPropagation();
            if (!selectDisabled) onToggle();
          }}
          className={cn(
            "absolute top-2 right-2 z-20 flex h-9 w-9 items-center justify-center rounded-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
            selected
              ? "opacity-100"
              : "opacity-80 sm:opacity-0 sm:group-hover:opacity-100 bg-black/50 text-white hover:bg-black/75",
            selectDisabled && "cursor-not-allowed opacity-30"
          )}
        >
          {selected ? (
            <div className="flex h-5 w-5 items-center justify-center bg-white shadow-sm">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6.5L4.5 9L10 3.5"
                  stroke="#0a0a0a"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>
            </div>
          ) : (
            <div className="h-5 w-5 rounded-none border border-white/80 bg-black/30 backdrop-blur-sm" />
          )}
        </button>

        {/* Dedicated Zoom Lens Button in Bottom-Left Corner */}
        {onOpenZoom ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenZoom();
            }}
            aria-label={`Zoom photo ${filename}`}
            className="absolute bottom-2 left-2 z-20 flex h-8 w-8 items-center justify-center rounded-sm bg-black/60 text-white/90 shadow-sm backdrop-blur-md opacity-90 transition-opacity hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <ZoomIn className="h-4 w-4" aria-hidden />
          </button>
        ) : null}

        {/* Final Download Button */}
        {isFinal && downloadTarget ? (
          <a
            href={downloadTarget}
            download={filename}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Download full resolution ${filename}`}
            className="absolute bottom-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-sm bg-bg-secondary/90 text-text-primary shadow-sm backdrop-blur-md opacity-90 transition-opacity hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
          >
            <Download className="h-4 w-4" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}
