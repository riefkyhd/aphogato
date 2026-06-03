import type { Photo } from "@/lib/types";

export function partitionPhotosSelectedFirst(
  photos: Photo[],
  isSelected: (photo: Photo) => boolean
): { ordered: Photo[]; selectedCount: number } {
  const selected: Photo[] = [];
  const unselected: Photo[] = [];

  for (const photo of photos) {
    if (isSelected(photo)) {
      selected.push(photo);
    } else {
      unselected.push(photo);
    }
  }

  return {
    ordered: [...selected, ...unselected],
    selectedCount: selected.length,
  };
}
