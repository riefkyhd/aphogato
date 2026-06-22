"use client";

import { MasonryPhoto } from "@/components/MasonryPhoto";
import { SelectablePhotoCell } from "@/components/SelectablePhotoCell";
import { SelectionOverlay } from "@/components/SelectionOverlay";
import { useColumnCount } from "@/hooks/useColumnCount";

export function GalleryPhotoCell({
  cloudinaryUrl,
  filename,
  selected,
  selectDisabled = false,
  onToggle,
}: {
  cloudinaryUrl: string;
  filename: string;
  selected: boolean;
  selectDisabled?: boolean;
  onToggle: () => void;
}) {
  const columnCount = useColumnCount("gallery");

  return (
    <SelectablePhotoCell
      selected={selected}
      selectDisabled={selectDisabled}
      onToggle={onToggle}
      aria-label={`${selected ? "Deselect" : "Select"} ${filename}`}
      className="[content-visibility:auto] [contain-intrinsic-size:auto_280px]"
    >
      <MasonryPhoto
        src={cloudinaryUrl}
        alt=""
        variant="gallery"
        galleryColumnCount={columnCount}
        className="pointer-events-none select-none transition duration-200 group-hover:brightness-105"
      />
      {selected ? <SelectionOverlay /> : null}
    </SelectablePhotoCell>
  );
}
