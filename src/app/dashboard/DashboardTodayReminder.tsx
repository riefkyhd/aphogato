"use client";

import { TodayShootsReminder } from "@/components/calendar/TodayShootsReminder";
import type { CalendarEvent } from "@/lib/types";

/** Shown below the navbar on all dashboard routes when shoots are scheduled today. */
export function DashboardTodayReminder({
  initialEvents,
}: {
  initialEvents: CalendarEvent[];
}) {
  return <TodayShootsReminder initialEvents={initialEvents} />;
}
