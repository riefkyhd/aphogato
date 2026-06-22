"use client";

import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import {
  dismissBannerForToday,
  filterActiveTodayEvents,
  formatTodayShootsSummary,
  getNowMinutesInTimezone,
  getTodayDateString,
  isBannerDismissedForToday,
  isBrowserReminderEnabled,
} from "@/lib/calendar/todayEvents";
import type { CalendarEvent } from "@/lib/types";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/features";
import { Bell, Calendar, X } from "lucide-react";
import Link from "next/link";
import { useUserPreferencesContext } from "@/components/preferences/UserPreferencesProvider";
import { useEffect, useMemo, useState } from "react";

function maybeShowBrowserNotification(events: CalendarEvent[]) {
  if (!isBrowserReminderEnabled()) return;
  if (events.length === 0) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const body = formatTodayShootsSummary(events);

  try {
    new Notification(
      events.length === 1 ? "Photoshoot today" : `${events.length} photoshoots today`,
      {
        body,
        icon: "/images/logo/MH_logo.png",
        tag: `aphogato-today-${Date.now()}`,
      }
    );
  } catch {
    // ignore unsupported environments
  }
}

export function TodayShootsReminder({
  initialEvents,
  className,
}: {
  initialEvents: CalendarEvent[];
  className?: string;
}) {
  const { loaded: prefsLoaded } = useUserPreferencesContext();
  const [dismissed, setDismissed] = useState(false);
  const [notified, setNotified] = useState(false);
  const [nowMinutes, setNowMinutes] = useState(() => getNowMinutesInTimezone());
  const today = getTodayDateString();

  const activeEvents = useMemo(
    () => filterActiveTodayEvents(initialEvents, nowMinutes),
    [initialEvents, nowMinutes]
  );

  useEffect(() => {
    setDismissed(isBannerDismissedForToday(today));
  }, [today]);

  useEffect(() => {
    const tick = () => setNowMinutes(getNowMinutesInTimezone());
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!prefsLoaded || notified || activeEvents.length === 0) {
      return;
    }
    maybeShowBrowserNotification(activeEvents);
    setNotified(true);
  }, [prefsLoaded, notified, activeEvents]);

  if (activeEvents.length === 0 || dismissed) {
    return null;
  }

  function handleDismiss() {
    dismissBannerForToday(today);
    setDismissed(true);
  }

  return (
    <div
      role="status"
      className={cn(
        "border-b border-status-editing/50 bg-bg-secondary",
        className
      )}
    >
      <DashboardShell className="py-3">
        <div className="flex gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-editing/20 text-status-editing"
            aria-hidden
          >
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-label text-status-editing mb-1">
              Today
            </p>
            <p className="text-[14px] text-text-primary font-medium">
              {activeEvents.length === 1
                ? "You have a photoshoot today"
                : `You have ${activeEvents.length} photoshoots today`}
            </p>
            <ul className="mt-2 space-y-1.5">
              {activeEvents.map((ev) => {
                const time = formatEventTimeRange(
                  ev.shoot_time,
                  ev.shoot_end_time
                );
                return (
                  <li
                    key={ev.id}
                    className="text-[13px] text-text-secondary flex flex-wrap gap-x-2 gap-y-0.5"
                  >
                    <span className="text-text-primary">{ev.title}</span>
                    {time && (
                      <span className="text-text-muted">{time}</span>
                    )}
                    {ev.location && (
                      <span className="text-text-muted truncate max-w-full">
                        · {ev.location}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {FEATURES.calendar ? (
            <Link
              href="/dashboard/calendar"
              className="inline-flex items-center gap-1.5 mt-3 text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              Open calendar
            </Link>
            ) : null}
          </div>
          <Tooltip label="Dismiss reminder">
            <button
              type="button"
              onClick={handleDismiss}
              className="shrink-0 p-1 text-text-muted hover:text-text-primary"
              aria-label="Dismiss today reminder"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </DashboardShell>
    </div>
  );
}
