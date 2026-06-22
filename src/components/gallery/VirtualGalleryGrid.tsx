"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GalleryPhotoCell } from "@/components/gallery/GalleryPhotoCell";
import { LoadMoreSentinel } from "@/components/gallery/LoadMoreSentinel";
import { MasonryColumnGrid } from "@/components/MasonryColumnGrid";
import type { Photo } from "@/lib/types";

const BATCH_SIZE = 54;

export function VirtualGalleryGrid({
  photos,
  selectedIds,
  onOpenPhoto,
}: {
  photos: Photo[];
  selectedIds: Set<string>;
  onOpenPhoto: (index: number) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(BATCH_SIZE, photos.length)
  );

  useEffect(() => {
    setVisibleCount(Math.min(BATCH_SIZE, photos.length));
  }, [photos]);

  const visiblePhotos = useMemo(
    () => photos.slice(0, visibleCount),
    [photos, visibleCount]
  );

  const hasMore = visibleCount < photos.length;

  const loadMore = useCallback(() => {
    setVisibleCount((current) =>
      Math.min(current + BATCH_SIZE, photos.length)
    );
  }, [photos.length]);

  const photoIndexById = useMemo(() => {
    const map = new Map<string, number>();
    photos.forEach((photo, idx) => map.set(photo.id, idx));
    return map;
  }, [photos]);

  return (
    <>
      <MasonryColumnGrid
        items={visiblePhotos}
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
      {hasMore ? (
        <div className="py-6 text-center">
          <p className="text-[11px] uppercase tracking-label text-text-muted mb-2">
            Loading more photos…
          </p>
          <LoadMoreSentinel onLoadMore={loadMore} disabled={!hasMore} />
        </div>
      ) : null}
    </>
  );
}
