"use client";

import { useEffect, useMemo, useState } from "react";
import { useOptionalUserPreferencesContext } from "@/components/preferences/UserPreferencesProvider";
import { PhotoFilterToggle } from "@/components/PhotoFilterToggle";
import { PhotoSortSelect } from "@/components/PhotoSortSelect";
import { PhotoViewToggle } from "@/components/PhotoViewToggle";
import { PhotoGridView } from "@/components/PhotoGridView";
import { PhotoListView } from "@/components/PhotoListView";
import {
  readPhotoFilterPreference,
  writePhotoFilterPreference,
} from "@/lib/photoFilterStorage";
import {
  readPhotoSortPreference,
  type PhotoSortPreference,
} from "@/lib/photoSortStorage";
import {
  readPhotoViewPreference,
  writePhotoViewPreference,
  type PhotoViewMode,
} from "@/lib/photoViewStorage";
import { ManagePhotoLightbox } from "@/components/ManagePhotoLightbox";
import { Button } from "@/components/ui/Button";
import { useTouchLike } from "@/hooks/useTouchLike";
import type { ManagePhotoActivateMeta } from "@/lib/managePhotoActivate";
import { partitionPhotosSelectedFirst } from "@/lib/reorderPhotos";
import { DEFAULT_SORT_DIRECTION, sortPhotos } from "@/lib/sortPhotos";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  onCloseManagePreview,
  selectionLimitReached = false,
  ready = true,
}: {
  photos: Photo[];
  mode: "gallery" | "dashboard";
  viewStorageId: string;
  selectedIds: Set<string>;
  onToggleSelect?: (id: string) => void;
  selectionLimitReached?: boolean;
  manageSelectedIds?: Set<string>;
  onManagePhotoActivate?: (id: string, meta: ManagePhotoActivateMeta) => void;
  onManagePhotoMarquee?: (ids: string[], mergeBase?: string[]) => void;
  managePreviewId?: string | null;
  onClearManageSelection?: () => void;
  onDeletePhotos?: () => void;
  onCloseManagePreview?: () => void;
  ready?: boolean;
}) {
  const touchLike = useTouchLike();
  const prefsCtx = useOptionalUserPreferencesContext();
  const [view, setView] = useState<PhotoViewMode>("grid");
  const [selectedFirst, setSelectedFirst] = useState(false);
  const [sortPreference, setSortPreference] = useState<PhotoSortPreference>(() =>
    readPhotoSortPreference(viewStorageId)
  );

  useEffect(() => {
    if (prefsCtx && !prefsCtx.loaded) return;
    setView(readPhotoViewPreference(viewStorageId));
    setSelectedFirst(readPhotoFilterPreference(viewStorageId));
    setSortPreference(readPhotoSortPreference(viewStorageId));
  }, [
    viewStorageId,
    prefsCtx,
    prefsCtx?.loaded,
    prefsCtx?.preferences.defaultPhotoView,
    prefsCtx?.preferences.defaultPhotoSelectedFirst,
  ]);

  function handleViewChange(next: PhotoViewMode) {
    setView(next);
    writePhotoViewPreference(viewStorageId, next);
  }

  function handleFilterChange(active: boolean) {
    setSelectedFirst(active);
    writePhotoFilterPreference(viewStorageId, active);
  }

  const sortedPhotos = useMemo(() => {
    const direction =
      sortPreference.directions[sortPreference.mode] ??
      DEFAULT_SORT_DIRECTION[sortPreference.mode];
    return sortPhotos(photos, sortPreference.mode, direction);
  }, [photos, sortPreference]);

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
  }, [sortedPhotos, selectedFirst, mode, selectedIds]);

  const layoutKey = selectedFirst
    ? mode === "gallery"
      ? `sf-confirmed-${confirmedSelectionKey}`
      : `sf-${Array.from(selectedIds).sort().join(",")}`
    : "default";

  if (!ready) {
    return (
      <div className="text-text-muted text-[13px]">
        Loading photos…
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <p className="text-text-muted text-[13px]">
        No photos in this project.
      </p>
    );
  }

  const manageCount = manageSelectedIds?.size ?? 0;
  const showManageActions =
    mode === "dashboard" &&
    Boolean(onManagePhotoActivate && onClearManageSelection && onDeletePhotos) &&
    manageCount > 0;
  const previewPhoto =
    managePreviewId && mode === "dashboard"
      ? photos.find((p) => p.id === managePreviewId) ?? null
      : null;
  const showMobileLightbox =
    touchLike && view === "grid" && Boolean(previewPhoto && onCloseManagePreview);

  const isGallery = mode === "gallery";
  /** Client gallery scrolls with the page; dashboard keeps a bounded panel. */
  const viewportClass = isGallery
    ? "relative"
    : "relative h-[min(65dvh,720px)] min-h-[280px] sm:min-h-[320px]";
  const gridLayerClass = isGallery
    ? view === "grid"
      ? "block"
      : "hidden"
    : view === "grid"
      ? "absolute inset-0 overflow-y-auto"
      : "absolute inset-0 overflow-hidden invisible pointer-events-none";
  const listLayerClass = isGallery
    ? view === "list"
      ? "flex flex-col min-h-[calc(100dvh-11.5rem)] max-h-[calc(100dvh-11.5rem)]"
      : "hidden"
    : view === "list"
      ? "absolute inset-0 flex flex-col overflow-hidden"
      : "absolute inset-0 flex flex-col overflow-hidden invisible pointer-events-none";

  return (
    <div className={cn(showManageActions && "max-sm:pb-[4.5rem]")}>
      {showMobileLightbox && onCloseManagePreview && (
        <ManagePhotoLightbox photo={previewPhoto} onClose={onCloseManagePreview} />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3">
        <div className="hidden sm:flex flex-wrap items-center gap-2 min-w-0">
          {showManageActions && (
            <>
              <span className="text-[11px] uppercase tracking-label text-text-secondary whitespace-nowrap">
                {manageCount} selected
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClearManageSelection}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                className="!bg-status-editing !border-status-editing hover:opacity-90"
                onClick={onDeletePhotos}
              >
                Delete
              </Button>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PhotoSortSelect
            preference={sortPreference}
            onChange={setSortPreference}
            viewStorageId={viewStorageId}
          />
          <PhotoFilterToggle
            active={selectedFirst}
            onChange={handleFilterChange}
          />
          <PhotoViewToggle view={view} onChange={handleViewChange} />
        </div>
      </div>
      <div key={layoutKey} className={viewportClass}>
        <div data-photo-grid-scroll className={gridLayerClass} aria-hidden={view !== "grid"}>
          <PhotoGridView
            photos={displayPhotos}
            mode={mode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            selectionLimitReached={selectionLimitReached}
            manageSelectedIds={manageSelectedIds}
            onManagePhotoActivate={onManagePhotoActivate}
            onManagePhotoMarquee={onManagePhotoMarquee}
            onClearManageSelection={onClearManageSelection}
          />
        </div>
        <div className={listLayerClass} aria-hidden={view !== "list"}>
          <PhotoListView
            photos={displayPhotos}
            mode={mode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            selectionLimitReached={selectionLimitReached}
            manageSelectedIds={manageSelectedIds}
            onManagePhotoActivate={onManagePhotoActivate}
            managePreviewId={managePreviewId}
            showSelectedDivider={showListDivider}
            selectedGroupCount={selectedCount}
            className="h-full min-h-0"
          />
        </div>
      </div>
      {showManageActions && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg-secondary/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-label text-text-secondary whitespace-nowrap mr-auto">
            {manageCount} selected
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClearManageSelection}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            className="!bg-status-editing !border-status-editing hover:opacity-90"
            onClick={onDeletePhotos}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
