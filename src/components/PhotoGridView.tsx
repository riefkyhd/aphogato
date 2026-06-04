import { MasonryColumnGrid } from "@/components/MasonryColumnGrid";
import { ClientPickIndicator } from "@/components/ClientPickIndicator";
import { MasonryPhoto } from "@/components/MasonryPhoto";
import { ManagePhotoCell } from "@/components/ManagePhotoCell";
import { ManageSelectionOverlay } from "@/components/ManageSelectionOverlay";
import { SelectablePhotoCell } from "@/components/SelectablePhotoCell";
import { SelectionOverlay } from "@/components/SelectionOverlay";
import type { ManagePhotoActivateMeta } from "@/lib/managePhotoActivate";
import type { Photo } from "@/lib/types";

export function PhotoGridView({
  photos,
  mode,
  selectedIds,
  onToggleSelect,
  manageSelectedIds,
  onManagePhotoActivate,
}: {
  photos: Photo[];
  mode: "gallery" | "dashboard";
  selectedIds: Set<string>;
  onToggleSelect?: (id: string) => void;
  manageSelectedIds?: Set<string>;
  onManagePhotoActivate?: (id: string, meta: ManagePhotoActivateMeta) => void;
}) {
  const manageMode = mode === "dashboard" && Boolean(onManagePhotoActivate);

  if (mode === "gallery" && onToggleSelect) {
    return (
      <MasonryColumnGrid
        items={photos}
        getKey={(ph) => ph.id}
        renderItem={(ph) => {
          const isSelected = selectedIds.has(ph.id);
          return (
            <SelectablePhotoCell
              selected={isSelected}
              onToggle={() => onToggleSelect(ph.id)}
              aria-label={`${isSelected ? "Deselect" : "Select"} ${ph.filename}`}
            >
              <MasonryPhoto
                src={ph.cloudinary_url}
                alt=""
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
      <MasonryColumnGrid
        items={photos}
        getKey={(ph) => ph.id}
        renderItem={(ph) => {
          const isManageSelected = manageSelectedIds.has(ph.id);
          return (
            <ManagePhotoCell
              selected={isManageSelected}
              onActivate={(meta) => onManagePhotoActivate(ph.id, meta)}
              aria-label={`${ph.filename}${isManageSelected ? ", selected for deletion" : ""}`}
            >
              <MasonryPhoto
                src={ph.cloudinary_url}
                alt={ph.filename}
                className="pointer-events-none select-none transition duration-200 group-hover:brightness-105"
              />
              {ph.is_selected && <ClientPickIndicator />}
              {isManageSelected && <ManageSelectionOverlay />}
            </ManagePhotoCell>
          );
        }}
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
