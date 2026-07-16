"use client";

import { useEffect, useMemo, useState } from "react";
import { useOptionalUserPreferencesContext } from "@/components/preferences/UserPreferencesProvider";
import { PhotoFilterToggle } from "@/components/PhotoFilterToggle";
import { PhotoSortSelect } from "@/components/PhotoSortSelect";
import { PhotoViewToggle } from "@/components/PhotoViewToggle";
import { PhotoGridView } from "@/components/PhotoGridView";
import { PhotoListView } from "@/components/PhotoListView";
import {
  MediaLoadStatusProvider,
  useMediaLoadFailedCount,
} from "@/components/media/MediaLoadStatus";
import { MediaUnavailableBanner } from "@/components/media/MediaUnavailable";
import {
  readPhotoFilterPreference,
  writePhotoFilterPreference,
} from "@/lib/photoFilterStorage";
import {
  readPhotoSortPreference,
  type PhotoSortPreference,
} from "@/lib/photoSortStorage";
import {
  photoViewStorageKey,
  readPhotoViewPreference,
  writePhotoViewPreference,
  type PhotoViewMode,
} from "@/lib/photoViewStorage";
import { ManagePhotoLightbox } from "@/components/ManagePhotoLightbox";
import { Button } from "@/components/ui/Button";
import { useTouchLike } from "@/hooks/useTouchLike";
import {
  MEDIA_UNAVAILABLE_BANNER_ADMIN,
  MEDIA_UNAVAILABLE_BANNER_GALLERY,
} from "@/lib/cloudinary/accountStatus";
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
  coverPhotoId,
  onSetCover,
  selectionLimitReached = false,
  ready = true,
  facePickMode = false,
  onFacePickPhoto,
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
  coverPhotoId?: string | null;
  onSetCover?: () => void;
  ready?: boolean;
  facePickMode?: boolean;
  onFacePickPhoto?: (photo: Photo) => void;
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
    if (mode === "gallery") {
      setView("grid");
      try {
        if (window.localStorage.getItem(photoViewStorageKey(viewStorageId)) === "list") {
          window.localStorage.removeItem(photoViewStorageKey(viewStorageId));
        }
      } catch {
        // ignore
      }
    } else {
      setView(readPhotoViewPreference(viewStorageId));
    }
    setSelectedFirst(readPhotoFilterPreference(viewStorageId));
    setSortPreference(readPhotoSortPreference(viewStorageId));
  }, [
    viewStorageId,
    mode,
    prefsCtx,
    prefsCtx?.loaded,
    prefsCtx?.preferences.defaultPhotoView,
    prefsCtx?.preferences.defaultPhotoSelectedFirst,
  ]);

  function handleViewChange(next: PhotoViewMode) {
    if (mode === "gallery") return;
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
    return null;
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
  const canSetCover = manageCount === 1 && Boolean(onSetCover);
  const previewPhoto =
    managePreviewId && mode === "dashboard"
      ? photos.find((p) => p.id === managePreviewId) ?? null
      : null;
  const isGallery = mode === "gallery";
  const activeView = isGallery ? "grid" : view;
  const showMobileLightbox =
    touchLike && activeView === "grid" && Boolean(previewPhoto && onCloseManagePreview);

  /** Client gallery scrolls with the page; dashboard keeps a bounded panel. */
  const viewportClass = isGallery
    ? "relative"
    : "relative h-[min(65dvh,720px)] min-h-[280px] sm:min-h-[320px]";
  const gridLayerClass = isGallery
    ? "block"
    : activeView === "grid"
      ? "absolute inset-0 overflow-y-auto"
      : "absolute inset-0 overflow-hidden invisible pointer-events-none";
  const listLayerClass =
    activeView === "list"
      ? "absolute inset-0 flex flex-col overflow-hidden"
      : "absolute inset-0 flex flex-col overflow-hidden invisible pointer-events-none";

  return (
    <MediaLoadStatusProvider>
      <PhotoGallerySectionBody
        showManageActions={showManageActions}
        showMobileLightbox={showMobileLightbox}
        previewPhoto={previewPhoto}
        onCloseManagePreview={onCloseManagePreview}
        manageCount={manageCount}
        onClearManageSelection={onClearManageSelection}
        canSetCover={canSetCover}
        onSetCover={onSetCover}
        onDeletePhotos={onDeletePhotos}
        isGallery={isGallery}
        sortPreference={sortPreference}
        setSortPreference={setSortPreference}
        viewStorageId={viewStorageId}
        mode={mode}
        selectedFirst={selectedFirst}
        handleFilterChange={handleFilterChange}
        activeView={activeView}
        handleViewChange={handleViewChange}
        layoutKey={layoutKey}
        viewportClass={viewportClass}
        gridLayerClass={gridLayerClass}
        listLayerClass={listLayerClass}
        displayPhotos={displayPhotos}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        selectionLimitReached={selectionLimitReached}
        manageSelectedIds={manageSelectedIds}
        onManagePhotoActivate={onManagePhotoActivate}
        onManagePhotoMarquee={onManagePhotoMarquee}
        managePreviewId={managePreviewId}
        coverPhotoId={coverPhotoId}
        facePickMode={facePickMode}
        onFacePickPhoto={onFacePickPhoto}
        showListDivider={showListDivider}
        selectedCount={selectedCount}
        photoCount={photos.length}
      />
    </MediaLoadStatusProvider>
  );
}

function PhotoGallerySectionBody({
  showManageActions,
  showMobileLightbox,
  previewPhoto,
  onCloseManagePreview,
  manageCount,
  onClearManageSelection,
  canSetCover,
  onSetCover,
  onDeletePhotos,
  isGallery,
  sortPreference,
  setSortPreference,
  viewStorageId,
  mode,
  selectedFirst,
  handleFilterChange,
  activeView,
  handleViewChange,
  layoutKey,
  viewportClass,
  gridLayerClass,
  listLayerClass,
  displayPhotos,
  selectedIds,
  onToggleSelect,
  selectionLimitReached,
  manageSelectedIds,
  onManagePhotoActivate,
  onManagePhotoMarquee,
  managePreviewId,
  coverPhotoId,
  facePickMode,
  onFacePickPhoto,
  showListDivider,
  selectedCount,
  photoCount,
}: {
  showManageActions: boolean;
  showMobileLightbox: boolean;
  previewPhoto: Photo | null;
  onCloseManagePreview?: () => void;
  manageCount: number;
  onClearManageSelection?: () => void;
  canSetCover: boolean;
  onSetCover?: () => void;
  onDeletePhotos?: () => void;
  isGallery: boolean;
  sortPreference: PhotoSortPreference;
  setSortPreference: (preference: PhotoSortPreference) => void;
  viewStorageId: string;
  mode: "gallery" | "dashboard";
  selectedFirst: boolean;
  handleFilterChange: (active: boolean) => void;
  activeView: PhotoViewMode;
  handleViewChange: (next: PhotoViewMode) => void;
  layoutKey: string;
  viewportClass: string;
  gridLayerClass: string;
  listLayerClass: string;
  displayPhotos: Photo[];
  selectedIds: Set<string>;
  onToggleSelect?: (id: string) => void;
  selectionLimitReached: boolean;
  manageSelectedIds?: Set<string>;
  onManagePhotoActivate?: (id: string, meta: ManagePhotoActivateMeta) => void;
  onManagePhotoMarquee?: (ids: string[], mergeBase?: string[]) => void;
  managePreviewId?: string | null;
  coverPhotoId?: string | null;
  facePickMode: boolean;
  onFacePickPhoto?: (photo: Photo) => void;
  showListDivider: boolean;
  selectedCount: number;
  photoCount: number;
}) {
  const failedCount = useMediaLoadFailedCount();
  const showUnavailableBanner =
    failedCount >= 2 || (failedCount >= 1 && photoCount === 1);

  return (
    <div className={cn(showManageActions && "max-sm:pb-[4.5rem]")}>
      {showUnavailableBanner ? (
        <MediaUnavailableBanner
          message={
            isGallery
              ? MEDIA_UNAVAILABLE_BANNER_GALLERY
              : MEDIA_UNAVAILABLE_BANNER_ADMIN
          }
        />
      ) : null}
      {showMobileLightbox && onCloseManagePreview && (
        <ManagePhotoLightbox photo={previewPhoto} onClose={onCloseManagePreview} />
      )}
      <div
        className={cn(
          "mb-3 flex flex-wrap items-center gap-2 sm:gap-3",
          showManageActions ? "justify-between" : "justify-end w-full"
        )}
      >
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
              {canSetCover ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onSetCover}
                >
                  Set cover
                </Button>
              ) : null}
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
        <div
          className={cn(
            isGallery
              ? "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
              : "flex shrink-0 flex-wrap items-center justify-end gap-2"
          )}
        >
          <PhotoSortSelect
            preference={sortPreference}
            onChange={setSortPreference}
            viewStorageId={viewStorageId}
          />
          <div className="flex items-center justify-end gap-2">
            {mode !== "gallery" ? (
              <PhotoFilterToggle
                active={selectedFirst}
                onChange={handleFilterChange}
              />
            ) : null}
            {mode !== "gallery" ? (
              <PhotoViewToggle view={activeView} onChange={handleViewChange} />
            ) : null}
          </div>
        </div>
      </div>
      <div key={layoutKey} className={viewportClass}>
        <div data-photo-grid-scroll className={gridLayerClass} aria-hidden={activeView !== "grid"}>
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
            coverPhotoId={coverPhotoId}
            facePickMode={facePickMode}
            onFacePickPhoto={onFacePickPhoto}
          />
        </div>
        {!isGallery ? (
          <div className={listLayerClass} aria-hidden={activeView !== "list"}>
            <PhotoListView
              photos={displayPhotos}
              mode={mode}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              selectionLimitReached={selectionLimitReached}
              manageSelectedIds={manageSelectedIds}
              onManagePhotoActivate={onManagePhotoActivate}
              managePreviewId={managePreviewId}
              coverPhotoId={coverPhotoId}
              showSelectedDivider={showListDivider}
              selectedGroupCount={selectedCount}
              className="h-full min-h-0"
            />
          </div>
        ) : null}
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
          {canSetCover ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onSetCover}
            >
              Cover
            </Button>
          ) : null}
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
