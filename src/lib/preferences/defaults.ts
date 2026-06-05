import { DEFAULT_MAX_PHOTO_SELECTION } from "@/lib/photoSelectionLimit";
import type { UserPreferences } from "@/lib/preferences/types";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  moneyVisibleByDefault: false,
  browserReminderEnabled: false,
  defaultPhotoView: "grid",
  defaultPhotoSelectedFirst: false,
  defaultMaxPhotoSelection: DEFAULT_MAX_PHOTO_SELECTION,
  defaultCalendarView: "month",
  pinSessionTimeoutMinutes: 30,
};
