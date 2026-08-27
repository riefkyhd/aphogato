import { createServerSupabase } from "@/lib/supabase/server";
import { FEATURES } from "@/lib/features";
import { normalizeClientSocialAccounts } from "@/lib/clients/socialAccounts";
import { attachClientBookStats } from "@/lib/clients/clientBookStats";
import type { Client } from "@/lib/types";
import { ClientsClient } from "./ClientsClient";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = createServerSupabase();
  const [clientsRes, projectsRes, eventsRes] = await Promise.all([
    supabase.from("clients").select("*").order("name", { ascending: true }),
    supabase.from("projects").select("client_name"),
    supabase
      .from("events")
      .select("client_name, shoot_date")
      .order("shoot_date", { ascending: false }),
  ]);

  const clients = ((clientsRes.data ?? []) as Client[]).map((row) => ({
    ...row,
    social_accounts: normalizeClientSocialAccounts(row.social_accounts),
  }));

  const clientsWithStats = attachClientBookStats(
    clients,
    projectsRes.data ?? [],
    eventsRes.data ?? []
  );

  return FEATURES.clients ? (
    <ClientsClient initialClients={clientsWithStats} />
  ) : null;
}
