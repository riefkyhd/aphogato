"use client";

import { useState } from "react";
import { GalleryPhotoLightbox } from "@/components/gallery/GalleryPhotoLightbox";
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
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
      <>
        <VirtualGalleryGrid
          photos={photos}
          selectedIds={selectedIds}
          onOpenPhoto={setLightboxIndex}
        />
        {lightboxIndex !== null ? (
          <GalleryPhotoLightbox
            photos={photos}
            index={lightboxIndex}
            selectedIds={selectedIds}
            selectionLimitReached={selectionLimitReached}
            onToggleSelect={onToggleSelect}
            onClose={() => setLightboxIndex(null)}
            onIndexChange={setLightboxIndex}
          />
        ) : null}
      </>
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
