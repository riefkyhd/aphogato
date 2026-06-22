"use client";

import { useEffect, useState } from "react";
import { DashboardTodayReminder } from "@/app/dashboard/DashboardTodayReminder";
import { Navbar } from "@/components/Navbar";
import { FEATURES } from "@/lib/features";
import type { CalendarEvent } from "@/lib/types";

/** Navbar + today banner; loads non-critical calendar data after first paint. */
export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!FEATURES.todayShootsReminder) return;

    let cancelled = false;

    void fetch("/api/calendar/events/today")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { events?: CalendarEvent[] } | null) => {
        if (!cancelled && Array.isArray(json?.events)) {
          setTodayEvents(json.events);
        }
      })
      .catch(() => {
        // Banner is optional; ignore fetch errors.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Navbar
        isAuthenticated
        shootsToday={FEATURES.todayShootsReminder ? todayEvents.length : 0}
      />
      <div className="pt-14 md:pt-[60px] flex flex-col min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100dvh-60px)]">
        {FEATURES.todayShootsReminder ? (
          <DashboardTodayReminder initialEvents={todayEvents} />
        ) : null}
        {children}
      </div>
    </>
  );
}
