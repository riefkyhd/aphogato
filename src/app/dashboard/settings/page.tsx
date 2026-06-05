import { Suspense } from "react";
import { DomainSecurityInfo } from "@/app/dashboard/settings/DomainSecurityInfo";
import { GoogleCalendarSettings } from "@/app/dashboard/settings/GoogleCalendarSettings";
import { PrivacySettings } from "@/app/dashboard/settings/PrivacySettings";
import { TodayReminderSettings } from "@/app/dashboard/settings/TodayReminderSettings";
import { isGoogleCalendarConnected } from "@/lib/calendar/googleSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const isConnected = await isGoogleCalendarConnected();

  return (
    <main className="px-4 sm:px-6 md:px-10 py-6 sm:py-10">
      <h1 className="text-2xl font-light tracking-[0.05em] uppercase mb-8">
        Settings
      </h1>
      <Suspense fallback={null}>
        <GoogleCalendarSettings isConnected={isConnected} />
      </Suspense>
      <TodayReminderSettings />
      <PrivacySettings />
      <DomainSecurityInfo />
    </main>
  );
}
