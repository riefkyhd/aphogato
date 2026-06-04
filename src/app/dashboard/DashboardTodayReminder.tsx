"use client";

import { TodayShootsReminder } from "@/components/calendar/TodayShootsReminder";

/** Shown below the navbar on all dashboard routes when shoots are scheduled today. */
export function DashboardTodayReminder() {
  return <TodayShootsReminder />;
}
