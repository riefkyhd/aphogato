"use client";

import { useEffect, useMemo, useState } from "react";
import { PhotoFilterToggle } from "@/components/PhotoFilterToggle";
import { PhotoViewToggle } from "@/components/PhotoViewToggle";
import { PhotoGridView } from "@/components/PhotoGridView";
import { PhotoListView } from "@/components/PhotoListView";
import {
  readPhotoFilterPreference,
  writePhotoFilterPreference,
} from "@/lib/photoFilterStorage";
import {
  readPhotoViewPreference,
  writePhotoViewPreference,
  type PhotoViewMode,
} from "@/lib/photoViewStorage";
import { partitionPhotosSelectedFirst } from "@/lib/reorderPhotos";
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
  const [selectedFirst, setSelectedFirst] = useState(false);

  useEffect(() => {
    setView(readPhotoViewPreference(viewStorageId));
    setSelectedFirst(readPhotoFilterPreference(viewStorageId));
  }, [viewStorageId]);

  function handleViewChange(next: PhotoViewMode) {
    setView(next);
    writePhotoViewPreference(viewStorageId, next);
  }

  function handleFilterChange(active: boolean) {
    setSelectedFirst(active);
    writePhotoFilterPreference(viewStorageId, active);
  }

  const { displayPhotos, selectedCount, showListDivider } = useMemo(() => {
    if (!selectedFirst) {
      return {
        displayPhotos: photos,
        selectedCount: 0,
        showListDivider: false,
      };
    }
    const { ordered, selectedCount: count } = partitionPhotosSelectedFirst(
      photos,
      (photo) => selectedIds.has(photo.id)
    );
    return {
      displayPhotos: ordered,
      selectedCount: count,
      showListDivider: count > 0 && count < photos.length,
    };
  }, [photos, selectedFirst, selectedIds]);

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
      <div className="flex justify-end items-center gap-2 px-4 md:px-8 mb-3">
        <PhotoFilterToggle
          active={selectedFirst}
          onChange={handleFilterChange}
        />
        <PhotoViewToggle view={view} onChange={handleViewChange} />
      </div>
      {view === "grid" ? (
        <PhotoGridView
          photos={displayPhotos}
          mode={mode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      ) : (
        <PhotoListView
          photos={displayPhotos}
          mode={mode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          showSelectedDivider={showListDivider}
          selectedGroupCount={selectedCount}
        />
      )}
    </div>
  );
}
