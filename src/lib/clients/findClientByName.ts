import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client } from "@/lib/types";

export async function findClientByName(
  supabase: SupabaseClient,
  name: string
): Promise<Client | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  const { data, error } = await supabase.from("clients").select("*");
  if (error) throw error;

  return (
    (data as Client[] | null)?.find(
      (row) => row.name.trim().toLowerCase() === normalized
    ) ?? null
  );
}
