"use client";

import { MasonryPhoto } from "@/components/MasonryPhoto";
import { SelectionOverlay } from "@/components/SelectionOverlay";
import { cn } from "@/lib/utils";

export function GalleryPhotoCell({
  cloudinaryUrl,
  filename,
  selected,
  onOpen,
}: {
  cloudinaryUrl: string;
  filename: string;
  selected: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="w-full">
      <button
        type="button"
        className={cn(
          "relative block w-full touch-manipulation overflow-hidden text-left leading-none",
          "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
        )}
        aria-label={`Preview ${filename}${selected ? " (selected)" : ""}`}
        onClick={onOpen}
      >
        <MasonryPhoto
          src={cloudinaryUrl}
          alt=""
          variant="gallery"
          className="pointer-events-none select-none transition duration-200 group-hover:brightness-105"
        />
        {selected ? <SelectionOverlay /> : null}
      </button>
    </div>
  );
}
