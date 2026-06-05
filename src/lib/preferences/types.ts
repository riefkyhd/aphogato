export type CalendarViewMode = "month" | "list";
export type PhotoViewMode = "grid" | "list";
export type PinSessionTimeoutMinutes = 15 | 30 | 60;

export interface UserPreferences {
  moneyVisibleByDefault: boolean;
  browserReminderEnabled: boolean;
  defaultPhotoView: PhotoViewMode;
  defaultPhotoSelectedFirst: boolean;
  defaultMaxPhotoSelection: number;
  defaultCalendarView: CalendarViewMode;
  pinSessionTimeoutMinutes: PinSessionTimeoutMinutes;
}

export type UserPreferencesPatch = Partial<UserPreferences>;
