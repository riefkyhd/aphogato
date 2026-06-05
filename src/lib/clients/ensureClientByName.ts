import type { SupabaseClient } from "@supabase/supabase-js";
import { findClientByName } from "@/lib/clients/findClientByName";

export async function ensureClientByName(
  supabase: SupabaseClient,
  name: string | null | undefined
): Promise<void> {
  const trimmed = name?.trim();
  if (!trimmed) return;

  const existing = await findClientByName(supabase, trimmed);
  if (existing) return;

  const { error } = await supabase.from("clients").insert({ name: trimmed });
  if (error?.code === "23505") return;
  if (error) throw error;
}
