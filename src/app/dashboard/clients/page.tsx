import { createServerSupabase } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";
import { ClientsClient } from "./ClientsClient";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  return <ClientsClient initialClients={(data ?? []) as Client[]} />;
}
