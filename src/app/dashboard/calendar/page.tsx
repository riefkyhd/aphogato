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
    quotationsRes,
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
      .select("id, name, quotation_id")
      .order("name", { ascending: true }),
    supabase
      .from("quotations")
      .select("id, quote_number, project_id"),
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
  const rawProjects = projectsRes.data ?? [];
  const rawQuotations = quotationsRes.data ?? [];

  const quoteByProj = new Map<string, { id: string; quote_number: string }>();
  const quoteById = new Map<string, { id: string; quote_number: string }>();
  for (const q of rawQuotations) {
    const qObj = { id: String(q.id), quote_number: String(q.quote_number) };
    quoteById.set(qObj.id, qObj);
    if (q.project_id) {
      quoteByProj.set(String(q.project_id), qObj);
    }
  }

  const projects = rawProjects.map((p) => {
    const pQuoteId = p.quotation_id ? String(p.quotation_id) : null;
    const quotation = (pQuoteId ? quoteById.get(pQuoteId) : null) ?? quoteByProj.get(p.id) ?? null;
    return {
      id: p.id,
      name: p.name,
      quotation_id: pQuoteId,
      quotation,
    };
  });

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
