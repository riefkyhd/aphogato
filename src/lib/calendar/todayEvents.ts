import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import { getPreferencesCache } from "@/lib/preferences/cache";
import type { CalendarEvent } from "@/lib/types";

export const CALENDAR_TIMEZONE = "Asia/Jakarta";

/** Today's date as YYYY-MM-DD in the app calendar timezone. */
export function getTodayDateString(
  date = new Date(),
  timeZone = CALENDAR_TIMEZONE
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatTodayShootsSummary(events: CalendarEvent[]): string {
  if (events.length === 0) return "";
  if (events.length === 1) {
    const ev = events[0];
    const time = formatEventTimeRange(ev.shoot_time, ev.shoot_end_time);
    return time ? `${ev.title} (${time})` : ev.title;
  }
  const names = events.slice(0, 3).map((e) => e.title);
  const extra = events.length > 3 ? ` +${events.length - 3} more` : "";
  return `${events.length} shoots: ${names.join(", ")}${extra}`;
}

export const BROWSER_REMINDER_KEY = "aphogato_today_browser_reminder";
export const BANNER_DISMISS_DATE_KEY = "aphogato_today_banner_dismiss";

export function isBrowserReminderEnabled(): boolean {
  return getPreferencesCache().browserReminderEnabled;
}

export function isBannerDismissedForToday(today: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(BANNER_DISMISS_DATE_KEY) === today;
}

export function dismissBannerForToday(today: string): void {
  sessionStorage.setItem(BANNER_DISMISS_DATE_KEY, today);
}
