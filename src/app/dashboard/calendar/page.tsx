import { CalendarClient } from "@/app/dashboard/calendar/CalendarClient";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createServerSupabase();

  const [eventsRes, projectsRes, settingsRes] = await Promise.all([
    supabase.from("events").select("*").order("shoot_date", { ascending: true }),
    supabase.from("projects").select("id, name").order("name", { ascending: true }),
    supabase
      .from("settings")
      .select("value")
      .eq("key", "google_refresh_token")
      .maybeSingle(),
  ]);

  const initialEvents = (eventsRes.data ?? []) as CalendarEvent[];
  const projects = projectsRes.data ?? [];
  const isGoogleConnected = Boolean(settingsRes.data?.value);

  return (
    <CalendarClient
      initialEvents={initialEvents}
      projects={projects}
      isGoogleConnected={isGoogleConnected}
    />
  );
}
