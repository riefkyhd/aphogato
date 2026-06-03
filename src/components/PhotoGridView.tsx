import { PhotoGrid, PhotoCell } from "@/components/PhotoGrid";
import { MasonryPhoto } from "@/components/MasonryPhoto";
import { SelectablePhotoCell } from "@/components/SelectablePhotoCell";
import { SelectionOverlay } from "@/components/SelectionOverlay";
import type { Photo } from "@/lib/types";

export function PhotoGridView({
  photos,
  mode,
  selectedIds,
  onToggleSelect,
}: {
  photos: Photo[];
  mode: "gallery" | "dashboard";
  selectedIds: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  if (mode === "gallery" && onToggleSelect) {
    return (
      <PhotoGrid>
        {photos.map((ph) => {
          const isSelected = selectedIds.has(ph.id);
          return (
            <SelectablePhotoCell
              key={ph.id}
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
        })}
      </PhotoGrid>
    );
  }

  return (
    <PhotoGrid>
      {photos.map((ph) => (
        <PhotoCell key={ph.id}>
          <div className="relative w-full">
            <MasonryPhoto src={ph.cloudinary_url} alt={ph.filename} />
            {ph.is_selected && <SelectionOverlay />}
          </div>
        </PhotoCell>
      ))}
    </PhotoGrid>
  );
}
