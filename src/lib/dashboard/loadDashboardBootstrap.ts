import { getUserPreferences } from "@/lib/preferences/userPreferences";
import type { UserPreferences } from "@/lib/preferences/types";
import { isPrivacyPinEnabled } from "@/lib/privacy/settings";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardBootstrap = {
  preferences: UserPreferences;
  pinEnabled: boolean;
};

export async function loadDashboardBootstrap(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardBootstrap> {
  const [preferences, pinEnabled] = await Promise.all([
    getUserPreferences(supabase, userId),
    isPrivacyPinEnabled(),
  ]);
  return { preferences, pinEnabled };
}
