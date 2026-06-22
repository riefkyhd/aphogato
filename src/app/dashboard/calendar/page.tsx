import { CalendarClient } from "@/app/dashboard/calendar/CalendarClient";
import { FEATURES } from "@/lib/features";
import { isGoogleOAuthConfigured } from "@/lib/calendar/googleOAuthConfig";
import { isGoogleCalendarConnected } from "@/lib/calendar/googleSettings";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createServerSupabase();

  const [eventsRes, projectsRes, isGoogleConnected, isOAuthConfigured] =
    await Promise.all([
    supabase
      .from("events")
      .select("*")
      .order("shoot_date", { ascending: true }),
    supabase
      .from("projects")
      .select("id, name")
      .order("name", { ascending: true }),
    isGoogleCalendarConnected(),
    Promise.resolve(isGoogleOAuthConfigured()),
  ]);

  const initialEvents = (eventsRes.data ?? []) as CalendarEvent[];
  const projects = projectsRes.data ?? [];

  return FEATURES.calendar ? (
    <CalendarClient
      initialEvents={initialEvents}
      projects={projects}
      isGoogleConnected={isGoogleConnected}
      isOAuthConfigured={isOAuthConfigured}
    />
  ) : null;
}
