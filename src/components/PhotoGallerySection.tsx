"use client";

import { useEffect, useState } from "react";
import { PhotoViewToggle } from "@/components/PhotoViewToggle";
import { PhotoGridView } from "@/components/PhotoGridView";
import { PhotoListView } from "@/components/PhotoListView";
import {
  readPhotoViewPreference,
  writePhotoViewPreference,
  type PhotoViewMode,
} from "@/lib/photoViewStorage";
import type { Photo } from "@/lib/types";

export function PhotoGallerySection({
  photos,
  mode,
  viewStorageId,
  selectedIds,
  onToggleSelect,
  ready = true,
}: {
  photos: Photo[];
  mode: "gallery" | "dashboard";
  viewStorageId: string;
  selectedIds: Set<string>;
  onToggleSelect?: (id: string) => void;
  ready?: boolean;
}) {
  const [view, setView] = useState<PhotoViewMode>("grid");

  useEffect(() => {
    setView(readPhotoViewPreference(viewStorageId));
  }, [viewStorageId]);

  function handleViewChange(next: PhotoViewMode) {
    setView(next);
    writePhotoViewPreference(viewStorageId, next);
  }

  if (!ready) {
    return (
      <div className="px-4 md:px-8 text-text-muted text-[13px]">
        Loading photos…
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <p className="px-4 md:px-8 text-text-muted text-[13px]">
        No photos in this project.
      </p>
    );
  }

  return (
    <div>
      <div className="flex justify-end px-4 md:px-8 mb-3">
        <PhotoViewToggle view={view} onChange={handleViewChange} />
      </div>
      {view === "grid" ? (
        <PhotoGridView
          photos={photos}
          mode={mode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      ) : (
        <PhotoListView
          photos={photos}
          mode={mode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      )}
    </div>
  );
}
