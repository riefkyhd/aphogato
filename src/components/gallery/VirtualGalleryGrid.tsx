"use client";

import { useMemo } from "react";
import { GalleryPhotoCell } from "@/components/gallery/GalleryPhotoCell";
import { MasonryColumnGrid } from "@/components/MasonryColumnGrid";
import type { Photo } from "@/lib/types";

export function VirtualGalleryGrid({
  photos,
  selectedIds,
  selectionLimitReached = false,
  onTogglePhoto,
}: {
  photos: Photo[];
  selectedIds: Set<string>;
  selectionLimitReached?: boolean;
  onTogglePhoto: (index: number) => void;
}) {
  const photoIndexById = useMemo(() => {
    const map = new Map<string, number>();
    photos.forEach((photo, idx) => map.set(photo.id, idx));
    return map;
  }, [photos]);

  return (
    <MasonryColumnGrid
      items={photos}
      getKey={(ph) => ph.id}
      renderItem={(ph) => {
        const index = photoIndexById.get(ph.id) ?? 0;
        const selected = selectedIds.has(ph.id);
        return (
          <GalleryPhotoCell
            photoId={ph.id}
            cloudinaryUrl={ph.cloudinary_url}
            filename={ph.filename}
            selected={selected}
            selectDisabled={selectionLimitReached && !selected}
            isFinal={ph.stage === "final"}
            onToggle={() => onTogglePhoto(index)}
          />
        );
      }}
    />
  );
}
