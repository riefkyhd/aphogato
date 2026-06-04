import { Suspense } from "react";
import { GoogleCalendarSettings } from "@/app/dashboard/settings/GoogleCalendarSettings";
import { TodayReminderSettings } from "@/app/dashboard/settings/TodayReminderSettings";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "google_refresh_token")
    .maybeSingle();

  const isConnected = Boolean(data?.value);

  return (
    <main className="px-6 md:px-10 py-10">
      <h1 className="text-2xl font-light tracking-[0.05em] uppercase mb-8">
        Settings
      </h1>
      <Suspense fallback={null}>
        <GoogleCalendarSettings isConnected={isConnected} />
      </Suspense>
      <TodayReminderSettings />
    </main>
  );
}
