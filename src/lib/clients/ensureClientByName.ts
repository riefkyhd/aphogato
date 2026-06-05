import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureClientByName(
  supabase: SupabaseClient,
  name: string | null | undefined
): Promise<void> {
  const trimmed = name?.trim();
  if (!trimmed) return;

  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from("clients").insert({ name: trimmed });
  if (error?.code === "23505") return;
  if (error) throw error;
}
