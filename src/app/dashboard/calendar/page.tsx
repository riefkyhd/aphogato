import { CalendarClient } from "@/app/dashboard/calendar/CalendarClient";
import { isGoogleCalendarConnected } from "@/lib/calendar/googleSettings";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createServerSupabase();

  const [eventsRes, projectsRes, isGoogleConnected] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .order("shoot_date", { ascending: true }),
    supabase
      .from("projects")
      .select("id, name")
      .order("name", { ascending: true }),
    isGoogleCalendarConnected(),
  ]);

  const initialEvents = (eventsRes.data ?? []) as CalendarEvent[];
  const projects = projectsRes.data ?? [];

  return (
    <CalendarClient
      initialEvents={initialEvents}
      projects={projects}
      isGoogleConnected={isGoogleConnected}
    />
  );
}
