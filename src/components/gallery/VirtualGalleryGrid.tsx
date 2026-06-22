"use client";

import { useMemo } from "react";
import { GalleryPhotoCell } from "@/components/gallery/GalleryPhotoCell";
import { MasonryColumnGrid } from "@/components/MasonryColumnGrid";
import type { Photo } from "@/lib/types";

export function VirtualGalleryGrid({
  photos,
  selectedIds,
  onOpenPhoto,
}: {
  photos: Photo[];
  selectedIds: Set<string>;
  onOpenPhoto: (index: number) => void;
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
        return (
          <GalleryPhotoCell
            cloudinaryUrl={ph.cloudinary_url}
            filename={ph.filename}
            selected={selectedIds.has(ph.id)}
            onOpen={() => onOpenPhoto(index)}
          />
        );
      }}
    />
  );
}
