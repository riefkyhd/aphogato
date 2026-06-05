import { mergeUserPreferences, normalizeUserPreferences } from "@/lib/preferences/normalize";
import type { UserPreferences, UserPreferencesPatch } from "@/lib/preferences/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("preferences")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return normalizeUserPreferences({});
  }

  return normalizeUserPreferences(data.preferences);
}

export async function patchUserPreferences(
  supabase: SupabaseClient,
  userId: string,
  patch: UserPreferencesPatch
): Promise<UserPreferences> {
  const current = await getUserPreferences(supabase, userId);
  const next = mergeUserPreferences(current, patch);

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      preferences: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return next;
}
