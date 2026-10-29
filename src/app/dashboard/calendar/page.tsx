import { Suspense } from "react";
import { ScheduleClientsWorkspace } from "@/app/dashboard/calendar/ScheduleClientsWorkspace";
import { FEATURES } from "@/lib/features";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import { isGoogleOAuthConfigured } from "@/lib/calendar/googleOAuthConfig";
import { isGoogleCalendarConnected } from "@/lib/calendar/googleSettings";
import { createServerSupabase } from "@/lib/supabase/server";
import { normalizeClientSocialAccounts } from "@/lib/clients/socialAccounts";
import { attachClientBookStats } from "@/lib/clients/clientBookStats";
import type { CalendarEvent, Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  if (!FEATURES.calendar && !FEATURES.clients) {
    return <FeatureDisabled label="Schedule & Clients" />;
  }

  const supabase = createServerSupabase();

  const [
    eventsRes,
    projectsRes,
    isGoogleConnected,
    isOAuthConfigured,
    clientsRes,
    clientProjectsRes,
    clientEventsRes,
  ] = await Promise.all([
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
    supabase.from("clients").select("*").order("name", { ascending: true }),
    supabase.from("projects").select("client_name"),
    supabase
      .from("events")
      .select("client_name, shoot_date")
      .order("shoot_date", { ascending: false }),
  ]);

  const initialEvents = (eventsRes.data ?? []) as CalendarEvent[];
  const projects = projectsRes.data ?? [];

  const rawClients = ((clientsRes.data ?? []) as Client[]).map((row) => ({
    ...row,
    social_accounts: normalizeClientSocialAccounts(row.social_accounts),
  }));

  const initialClients = attachClientBookStats(
    rawClients,
    clientProjectsRes.data ?? [],
    clientEventsRes.data ?? []
  );

  return (
    <Suspense fallback={null}>
      <ScheduleClientsWorkspace
        initialEvents={initialEvents}
        projects={projects}
        isGoogleConnected={isGoogleConnected}
        isOAuthConfigured={isOAuthConfigured}
        initialClients={initialClients}
      />
    </Suspense>
  );
}
