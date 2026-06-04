import { MasonryColumnGrid } from "@/components/MasonryColumnGrid";
import { MasonryPhoto } from "@/components/MasonryPhoto";
import { ManagePhotoGrid } from "@/components/ManagePhotoGrid";
import { SelectablePhotoCell } from "@/components/SelectablePhotoCell";
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
      <MasonryColumnGrid
        layoutMode="gallery"
        className="gap-[3px] sm:gap-1"
        items={photos}
        getKey={(ph) => ph.id}
        renderItem={(ph) => {
          const isSelected = selectedIds.has(ph.id);
          const selectBlocked = selectionLimitReached && !isSelected;
          return (
            <SelectablePhotoCell
              selected={isSelected}
              selectDisabled={selectBlocked}
              onToggle={() => onToggleSelect(ph.id)}
              aria-label={`${isSelected ? "Deselect" : "Select"} ${ph.filename}`}
            >
              <MasonryPhoto
                src={ph.cloudinary_url}
                alt=""
                variant="gallery"
                className="pointer-events-none select-none transition duration-200 group-hover:brightness-105"
              />
              {isSelected && <SelectionOverlay />}
            </SelectablePhotoCell>
          );
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
