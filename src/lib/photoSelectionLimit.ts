export const DEFAULT_MAX_PHOTO_SELECTION = 50;
export const MIN_MAX_PHOTO_SELECTION = 1;
export const MAX_MAX_PHOTO_SELECTION = 999;

export function normalizeMaxPhotoSelection(
  value: unknown,
  fallback = DEFAULT_MAX_PHOTO_SELECTION
): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;
  if (!Number.isFinite(n) || !Number.isInteger(n)) return fallback;
  if (n < MIN_MAX_PHOTO_SELECTION) return MIN_MAX_PHOTO_SELECTION;
  if (n > MAX_MAX_PHOTO_SELECTION) return MAX_MAX_PHOTO_SELECTION;
  return n;
}

export function parseMaxPhotoSelectionInput(
  value: unknown
): { ok: true; value: number } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: DEFAULT_MAX_PHOTO_SELECTION };
  }
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return {
      ok: false,
      error: `Max selection must be a whole number between ${MIN_MAX_PHOTO_SELECTION} and ${MAX_MAX_PHOTO_SELECTION}.`,
    };
  }
  if (n < MIN_MAX_PHOTO_SELECTION || n > MAX_MAX_PHOTO_SELECTION) {
    return {
      ok: false,
      error: `Max selection must be between ${MIN_MAX_PHOTO_SELECTION} and ${MAX_MAX_PHOTO_SELECTION}.`,
    };
  }
  return { ok: true, value: n };
}

export function isOverSelectionLimit(count: number, max: number): boolean {
  return count > max;
}

export function selectionLimitExceededMessage(
  selectedCount: number,
  max: number
): string {
  const over = selectedCount - max;
  if (over <= 0) {
    return `You can select up to ${max} photo${max === 1 ? "" : "s"}.`;
  }
  return `You can select up to ${max} photo${max === 1 ? "" : "s"}. Deselect ${over} more to save.`;
}

export function selectionAtLimitMessage(max: number): string {
  return `Maximum of ${max} photo${max === 1 ? "" : "s"} selected. Deselect one to choose a different photo.`;
}

export function formatSelectionCount(selected: number, max: number): string {
  return `${selected} / ${max} selected`;
}
