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
import { Button } from "@/components/ui/Button";
import type { ManagePhotoActivateMeta } from "@/lib/managePhotoActivate";
import { partitionPhotosSelectedFirst } from "@/lib/reorderPhotos";
import { sortPhotosNewestFirst } from "@/lib/sortPhotos";
import type { Photo } from "@/lib/types";

export function PhotoGallerySection({
  photos,
  mode,
  viewStorageId,
  selectedIds,
  onToggleSelect,
  manageSelectedIds,
  onManagePhotoActivate,
  onManagePhotoMarquee,
  managePreviewId,
  onClearManageSelection,
  onDeletePhotos,
  ready = true,
}: {
  photos: Photo[];
  mode: "gallery" | "dashboard";
  viewStorageId: string;
  selectedIds: Set<string>;
  onToggleSelect?: (id: string) => void;
  manageSelectedIds?: Set<string>;
  onManagePhotoActivate?: (id: string, meta: ManagePhotoActivateMeta) => void;
  onManagePhotoMarquee?: (ids: string[], mergeBase?: string[]) => void;
  managePreviewId?: string | null;
  onClearManageSelection?: () => void;
  onDeletePhotos?: () => void;
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

  const sortedPhotos = useMemo(() => sortPhotosNewestFirst(photos), [photos]);

  // Gallery: sort only by confirmed picks (is_selected), not live in-progress
  // selection — layout stays stable until the client clicks Update selection.
  const confirmedSelectionKey = useMemo(
    () =>
      photos
        .filter((p) => p.is_selected)
        .map((p) => p.id)
        .sort()
        .join(","),
    [photos]
  );

  const { displayPhotos, selectedCount, showListDivider } = useMemo(() => {
    if (!selectedFirst) {
      return {
        displayPhotos: sortedPhotos,
        selectedCount: 0,
        showListDivider: false,
      };
    }

    const isSelectedForSort =
      mode === "gallery"
        ? (photo: Photo) => photo.is_selected
        : (photo: Photo) => selectedIds.has(photo.id);

    const partitioned = partitionPhotosSelectedFirst(
      sortedPhotos,
      isSelectedForSort
    );
    return {
      displayPhotos: partitioned.ordered,
      selectedCount: partitioned.selectedCount,
      showListDivider:
        partitioned.selectedCount > 0 &&
        partitioned.selectedCount < sortedPhotos.length,
    };
  }, [sortedPhotos, selectedFirst, mode, selectedIds, confirmedSelectionKey]);

  const layoutKey = selectedFirst
    ? mode === "gallery"
      ? `sf-confirmed-${confirmedSelectionKey}`
      : `sf-${Array.from(selectedIds).sort().join(",")}`
    : "default";

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

  const manageCount = manageSelectedIds?.size ?? 0;
  const showManageActions =
    mode === "dashboard" &&
    Boolean(onManagePhotoActivate && onClearManageSelection && onDeletePhotos) &&
    manageCount > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 md:px-8 mb-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {showManageActions && (
            <>
              <span className="text-[11px] uppercase tracking-label text-text-secondary whitespace-nowrap">
                {manageCount} selected
              </span>
              <Button
                type="button"
                variant="secondary"
                className="!text-[11px] !h-8 !px-3"
                onClick={onClearManageSelection}
              >
                Clear
              </Button>
              <Button
                type="button"
                className="!text-[11px] !h-8 !px-3 !bg-status-editing !border-status-editing hover:opacity-90"
                onClick={onDeletePhotos}
              >
                Delete
              </Button>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PhotoFilterToggle
            active={selectedFirst}
            onChange={handleFilterChange}
          />
          <PhotoViewToggle view={view} onChange={handleViewChange} />
        </div>
      </div>
      <div
        key={layoutKey}
        className="relative h-[min(65dvh,720px)] min-h-[280px] sm:min-h-[320px]"
      >
        <div
          data-photo-grid-scroll
          className={
            view === "grid"
              ? "absolute inset-0 overflow-y-auto"
              : "absolute inset-0 overflow-hidden invisible pointer-events-none"
          }
          aria-hidden={view !== "grid"}
        >
          <PhotoGridView
            photos={displayPhotos}
            mode={mode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            manageSelectedIds={manageSelectedIds}
            onManagePhotoActivate={onManagePhotoActivate}
            onManagePhotoMarquee={onManagePhotoMarquee}
            onClearManageSelection={onClearManageSelection}
          />
        </div>
        <div
          className={
            view === "list"
              ? "absolute inset-0 flex flex-col overflow-hidden"
              : "absolute inset-0 flex flex-col overflow-hidden invisible pointer-events-none"
          }
          aria-hidden={view !== "list"}
        >
          <PhotoListView
            photos={displayPhotos}
            mode={mode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            manageSelectedIds={manageSelectedIds}
            onManagePhotoActivate={onManagePhotoActivate}
            managePreviewId={managePreviewId}
            showSelectedDivider={showListDivider}
            selectedGroupCount={selectedCount}
            className="h-full min-h-0"
          />
        </div>
      </div>
    </div>
  );
}
