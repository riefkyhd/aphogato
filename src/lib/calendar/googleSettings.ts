import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const GOOGLE_REFRESH_TOKEN_KEY = "google_refresh_token";

export async function isGoogleCalendarConnected(): Promise<boolean> {
  const token = await getGoogleRefreshToken();
  return Boolean(token);
}

export async function getGoogleRefreshToken(): Promise<string | null> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", GOOGLE_REFRESH_TOKEN_KEY)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.value ?? null;
}

export async function storeGoogleRefreshToken(refreshToken: string): Promise<void> {
  const supabase = createAdminSupabase();
  const { error } = await supabase.from("settings").upsert({
    key: GOOGLE_REFRESH_TOKEN_KEY,
    value: refreshToken,
  });
  if (error) throw new Error(error.message);
}

export async function deleteGoogleRefreshToken(): Promise<void> {
  const supabase = createAdminSupabase();
  const { error } = await supabase
    .from("settings")
    .delete()
    .eq("key", GOOGLE_REFRESH_TOKEN_KEY);
  if (error) throw new Error(error.message);
}
