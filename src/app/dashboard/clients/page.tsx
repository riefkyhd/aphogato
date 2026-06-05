import { createServerSupabase } from "@/lib/supabase/server";
import { normalizeClientSocialAccounts } from "@/lib/clients/socialAccounts";
import type { Client } from "@/lib/types";
import { ClientsClient } from "./ClientsClient";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  const clients = ((data ?? []) as Client[]).map((row) => ({
    ...row,
    social_accounts: normalizeClientSocialAccounts(row.social_accounts),
  }));

  return <ClientsClient initialClients={clients} />;
}
