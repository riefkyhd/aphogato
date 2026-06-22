"use client";

import { VirtualGalleryGrid } from "@/components/gallery/VirtualGalleryGrid";
import { MasonryColumnGrid } from "@/components/MasonryColumnGrid";
import { MasonryPhoto } from "@/components/MasonryPhoto";
import { ManagePhotoGrid } from "@/components/ManagePhotoGrid";
import { SelectionOverlay } from "@/components/SelectionOverlay";
import type { ManagePhotoActivateMeta } from "@/lib/managePhotoActivate";
import type { Photo } from "@/lib/types";

export function PhotoGridView({
  photos,
  mode,
  selectedIds,
  onToggleSelect,
  selectionLimitReached = false,
  manageSelectedIds,
  onManagePhotoActivate,
  onManagePhotoMarquee,
  onClearManageSelection,
  facePickMode = false,
  onFacePickPhoto,
  coverPhotoId,
}: {
  photos: Photo[];
  mode: "gallery" | "dashboard";
  selectedIds: Set<string>;
  onToggleSelect?: (id: string) => void;
  selectionLimitReached?: boolean;
  manageSelectedIds?: Set<string>;
  onManagePhotoActivate?: (id: string, meta: ManagePhotoActivateMeta) => void;
  onManagePhotoMarquee?: (ids: string[], mergeBase?: string[]) => void;
  onClearManageSelection?: () => void;
  facePickMode?: boolean;
  onFacePickPhoto?: (photo: Photo) => void;
  coverPhotoId?: string | null;
}) {
  const manageMode =
    mode === "dashboard" &&
    Boolean(
      onManagePhotoActivate &&
        onManagePhotoMarquee &&
        onClearManageSelection &&
        manageSelectedIds
    );

  if (mode === "gallery" && onToggleSelect) {
    return (
      <VirtualGalleryGrid
        photos={photos}
        selectedIds={selectedIds}
        selectionLimitReached={selectionLimitReached}
        onTogglePhoto={(index) => {
          const photo = photos[index];
          if (!photo) return;
          if (facePickMode && onFacePickPhoto) {
            onFacePickPhoto(photo);
            return;
          }
          if (selectionLimitReached && !selectedIds.has(photo.id)) return;
          onToggleSelect(photo.id);
        }}
      />
    );
  }

  if (manageMode && manageSelectedIds && onManagePhotoActivate) {
    return (
      <ManagePhotoGrid
        photos={photos}
        manageSelectedIds={manageSelectedIds}
        onManagePhotoActivate={onManagePhotoActivate}
        onManagePhotoMarquee={onManagePhotoMarquee!}
        onClearManageSelection={onClearManageSelection!}
        coverPhotoId={coverPhotoId}
      />
    );
  }

  return (
    <MasonryColumnGrid
      items={photos}
      getKey={(ph) => ph.id}
      renderItem={(ph) => (
        <div className="relative w-full break-inside-avoid">
          <MasonryPhoto src={ph.cloudinary_url} alt={ph.filename} />
          {ph.is_selected && <SelectionOverlay />}
        </div>
      )}
    />
  );
}
