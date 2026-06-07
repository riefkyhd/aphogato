import {
  DEFAULT_SORT_DIRECTION,
  type PhotoSortDirection,
  type PhotoSortMode,
} from "@/lib/sortPhotos";

const PREF_KEY_PREFIX = "photo-sort-pref-";
const LEGACY_KEY_PREFIX = "photo-sort-";

const VALID_MODES = new Set<PhotoSortMode>([
  "shooting-time",
  "name",
  "time-added",
]);

export type PhotoSortPreference = {
  mode: PhotoSortMode;
  directions: Record<PhotoSortMode, PhotoSortDirection>;
};

export const PHOTO_SORT_OPTIONS: { value: PhotoSortMode; label: string }[] = [
  { value: "shooting-time", label: "Shooting time" },
  { value: "name", label: "Name" },
  { value: "time-added", label: "Time added" },
];

function defaultPreference(): PhotoSortPreference {
  return {
    mode: "time-added",
    directions: { ...DEFAULT_SORT_DIRECTION },
  };
}

function isValidDirection(value: unknown): value is PhotoSortDirection {
  return value === "asc" || value === "desc";
}

function normalizePreference(raw: unknown): PhotoSortPreference {
  const base = defaultPreference();
  if (!raw || typeof raw !== "object") return base;

  const input = raw as Partial<PhotoSortPreference>;
  const mode =
    typeof input.mode === "string" && VALID_MODES.has(input.mode as PhotoSortMode)
      ? (input.mode as PhotoSortMode)
      : base.mode;

  const directions = { ...base.directions };
  if (input.directions && typeof input.directions === "object") {
    for (const modeKey of VALID_MODES) {
      const dir = (input.directions as Record<string, unknown>)[modeKey];
      if (isValidDirection(dir)) {
        directions[modeKey] = dir;
      }
    }
  }

  return { mode, directions };
}

export function photoSortPreferenceKey(id: string) {
  return `${PREF_KEY_PREFIX}${id}`;
}

export function readPhotoSortPreference(id: string): PhotoSortPreference {
  if (typeof window === "undefined") return defaultPreference();

  try {
    const raw = window.localStorage.getItem(photoSortPreferenceKey(id));
    if (raw) {
      return normalizePreference(JSON.parse(raw) as unknown);
    }

    const legacy = window.localStorage.getItem(`${LEGACY_KEY_PREFIX}${id}`);
    if (legacy && VALID_MODES.has(legacy as PhotoSortMode)) {
      return { ...defaultPreference(), mode: legacy as PhotoSortMode };
    }
  } catch {
    // ignore
  }

  return defaultPreference();
}

export function writePhotoSortPreference(id: string, pref: PhotoSortPreference) {
  try {
    window.localStorage.setItem(
      photoSortPreferenceKey(id),
      JSON.stringify(normalizePreference(pref))
    );
  } catch {
    // ignore
  }
}

export function directionLabel(
  mode: PhotoSortMode,
  direction: PhotoSortDirection
): string {
  switch (mode) {
    case "shooting-time":
      return direction === "asc" ? "Oldest first" : "Newest first";
    case "name":
      return direction === "asc" ? "A to Z" : "Z to A";
    case "time-added":
      return direction === "asc" ? "Oldest added" : "Newest added";
    default:
      return direction === "asc" ? "Ascending" : "Descending";
  }
}
