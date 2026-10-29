"use client";

import { Download } from "lucide-react";
import { MasonryPhoto } from "@/components/MasonryPhoto";
import { SelectablePhotoCell } from "@/components/SelectablePhotoCell";
import { SelectionOverlay } from "@/components/SelectionOverlay";
import { useColumnCount } from "@/hooks/useColumnCount";
import { isGDriveUrl } from "@/lib/gdriveUrls";

export function GalleryPhotoCell({
  photoId,
  cloudinaryUrl,
  filename,
  selected,
  selectDisabled = false,
  isFinal = false,
  onToggle,
}: {
  photoId?: string;
  cloudinaryUrl: string;
  filename: string;
  selected: boolean;
  selectDisabled?: boolean;
  isFinal?: boolean;
  onToggle: () => void;
}) {
  const columnCount = useColumnCount("gallery");

  const downloadTarget = isGDriveUrl(cloudinaryUrl) && photoId
    ? `/api/media/${encodeURIComponent(photoId)}?download=1`
    : null;

  return (
    <SelectablePhotoCell
      selected={selected}
      selectDisabled={selectDisabled}
      onToggle={onToggle}
      aria-label={`${selected ? "Deselect" : "Select"} ${filename}`}
      className="group relative [content-visibility:auto] [contain-intrinsic-size:auto_280px]"
    >
      <MasonryPhoto
        src={cloudinaryUrl}
        alt=""
        variant="gallery"
        galleryColumnCount={columnCount}
        className="pointer-events-none select-none transition duration-200 group-hover:brightness-105"
      />
      {selected ? <SelectionOverlay /> : null}

      {isFinal && downloadTarget ? (
        <a
          href={downloadTarget}
          download={filename}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Download full resolution ${filename}`}
          className="absolute bottom-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-sm bg-bg-secondary/90 text-text-primary shadow-sm backdrop-blur-md opacity-90 transition-opacity hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Download className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
    </SelectablePhotoCell>
  );
}
