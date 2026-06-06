import "server-only";

import { getTodayDateString } from "@/lib/calendar/todayEvents";
import type { CalendarEvent } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadTodayEvents(
  supabase: SupabaseClient
): Promise<CalendarEvent[]> {
  const today = getTodayDateString();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("shoot_date", today)
    .order("shoot_time", { ascending: true });

  if (error || !data) return [];
  return data as CalendarEvent[];
}
