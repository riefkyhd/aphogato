import { DEFAULT_USER_PREFERENCES } from "@/lib/preferences/defaults";
import { normalizeMaxPhotoSelection } from "@/lib/photoSelectionLimit";
import type {
  CalendarViewMode,
  PhotoViewMode,
  PinSessionTimeoutMinutes,
  UserPreferences,
  UserPreferencesPatch,
} from "@/lib/preferences/types";

const PIN_TIMEOUT_OPTIONS: PinSessionTimeoutMinutes[] = [15, 30, 60];

function normalizePhotoView(value: unknown): PhotoViewMode {
  return value === "list" ? "list" : "grid";
}

function normalizeCalendarView(value: unknown): CalendarViewMode {
  return value === "list" ? "list" : "month";
}

function normalizePinTimeout(value: unknown): PinSessionTimeoutMinutes {
  const n = typeof value === "number" ? value : Number(value);
  if (PIN_TIMEOUT_OPTIONS.includes(n as PinSessionTimeoutMinutes)) {
    return n as PinSessionTimeoutMinutes;
  }
  return DEFAULT_USER_PREFERENCES.pinSessionTimeoutMinutes;
}

export function normalizeUserPreferences(
  raw: unknown
): UserPreferences {
  const input =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as UserPreferencesPatch)
      : {};

  return {
    moneyVisibleByDefault:
      typeof input.moneyVisibleByDefault === "boolean"
        ? input.moneyVisibleByDefault
        : DEFAULT_USER_PREFERENCES.moneyVisibleByDefault,
    browserReminderEnabled:
      typeof input.browserReminderEnabled === "boolean"
        ? input.browserReminderEnabled
        : DEFAULT_USER_PREFERENCES.browserReminderEnabled,
    defaultPhotoView: normalizePhotoView(input.defaultPhotoView),
    defaultPhotoSelectedFirst:
      typeof input.defaultPhotoSelectedFirst === "boolean"
        ? input.defaultPhotoSelectedFirst
        : DEFAULT_USER_PREFERENCES.defaultPhotoSelectedFirst,
    defaultMaxPhotoSelection: normalizeMaxPhotoSelection(
      input.defaultMaxPhotoSelection,
      DEFAULT_USER_PREFERENCES.defaultMaxPhotoSelection
    ),
    defaultCalendarView: normalizeCalendarView(input.defaultCalendarView),
    pinSessionTimeoutMinutes: normalizePinTimeout(
      input.pinSessionTimeoutMinutes
    ),
  };
}

export function mergeUserPreferences(
  current: UserPreferences,
  patch: UserPreferencesPatch
): UserPreferences {
  return normalizeUserPreferences({ ...current, ...patch });
}
