import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { PRIVACY_PIN_HASH_KEY } from "@/lib/privacy/constants";

export async function getPrivacyPinHash(): Promise<string | null> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", PRIVACY_PIN_HASH_KEY)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.value ?? null;
}

export async function isPrivacyPinEnabled(): Promise<boolean> {
  const hash = await getPrivacyPinHash();
  return Boolean(hash);
}

export async function setPrivacyPinHash(hash: string): Promise<void> {
  const supabase = createAdminSupabase();
  const { error } = await supabase.from("settings").upsert({
    key: PRIVACY_PIN_HASH_KEY,
    value: hash,
  });
  if (error) throw new Error(error.message);
}

export async function removePrivacyPinHash(): Promise<void> {
  const supabase = createAdminSupabase();
  const { error } = await supabase
    .from("settings")
    .delete()
    .eq("key", PRIVACY_PIN_HASH_KEY);
  if (error) throw new Error(error.message);
}
