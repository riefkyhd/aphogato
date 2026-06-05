"use client";

import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import {
  dismissBannerForToday,
  formatTodayShootsSummary,
  getTodayDateString,
  isBannerDismissedForToday,
  isBrowserReminderEnabled,
} from "@/lib/calendar/todayEvents";
import type { CalendarEvent } from "@/lib/types";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { Bell, Calendar, X } from "lucide-react";
import Link from "next/link";
import { useUserPreferencesContext } from "@/components/preferences/UserPreferencesProvider";
import { useCallback, useEffect, useState } from "react";

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

export function TodayShootsReminder({ className }: { className?: string }) {
  const { loaded: prefsLoaded } = useUserPreferencesContext();
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [notified, setNotified] = useState(false);
  const today = getTodayDateString();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/events/today");
      if (!res.ok) {
        setEvents([]);
        return;
      }
      const json = await res.json();
      const list = (json.events ?? []) as CalendarEvent[];
      setEvents(list);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    setDismissed(isBannerDismissedForToday(today));
    void load();
  }, [load, today]);

  useEffect(() => {
    if (!prefsLoaded || notified || events === null || events.length === 0) {
      return;
    }
    maybeShowBrowserNotification(events);
    setNotified(true);
  }, [prefsLoaded, notified, events]);

  if (events === null || events.length === 0 || dismissed) {
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
        "border border-status-editing/50 bg-bg-secondary px-4 py-3 sm:px-5",
        className
      )}
    >
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
            {events.length === 1
              ? "You have a photoshoot today"
              : `You have ${events.length} photoshoots today`}
          </p>
          <ul className="mt-2 space-y-1.5">
            {events.map((ev) => {
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
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center gap-1.5 mt-3 text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
          >
            <Calendar className="h-3.5 w-3.5" />
            Open calendar
          </Link>
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
    </div>
  );
}
