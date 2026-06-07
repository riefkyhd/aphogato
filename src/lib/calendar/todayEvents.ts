import {
  formatEventTimeRange,
  parseTimeToMinutes,
} from "@/lib/calendar/calendarHelpers";
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

export function getNowMinutesInTimezone(
  date = new Date(),
  timeZone = CALENDAR_TIMEZONE
): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0
  );
  return hour * 60 + minute;
}

/** True while the shoot is still in progress or upcoming today (Jakarta time). */
export function isEventStillActiveToday(
  event: CalendarEvent,
  nowMinutes = getNowMinutesInTimezone()
): boolean {
  if (!event.shoot_time) {
    return true;
  }

  const start = parseTimeToMinutes(event.shoot_time);
  if (start == null) {
    return true;
  }

  const end = event.shoot_end_time
    ? parseTimeToMinutes(event.shoot_end_time)
    : start + 60;

  if (end == null) {
    return nowMinutes <= start + 60;
  }

  const normalizedEnd = end < start ? end + 24 * 60 : end;
  const normalizedNow =
    end < start && nowMinutes < start ? nowMinutes + 24 * 60 : nowMinutes;

  return normalizedNow <= normalizedEnd;
}

export function filterActiveTodayEvents(
  events: CalendarEvent[],
  nowMinutes = getNowMinutesInTimezone()
): CalendarEvent[] {
  return events.filter((event) => isEventStillActiveToday(event, nowMinutes));
}
