import { Suspense } from "react";
import { ContentColumn } from "@/components/layout/ContentColumn";
import { DomainSecurityInfo } from "@/app/dashboard/settings/DomainSecurityInfo";
import { GoogleCalendarSettings } from "@/app/dashboard/settings/GoogleCalendarSettings";
import { PreferencesSettings } from "@/app/dashboard/settings/PreferencesSettings";
import { PrivacySettings } from "@/app/dashboard/settings/PrivacySettings";
import { TodayReminderSettings } from "@/app/dashboard/settings/TodayReminderSettings";
import { isGoogleCalendarConnected } from "@/lib/calendar/googleSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const isConnected = await isGoogleCalendarConnected();

  return (
    <main className="px-4 sm:px-6 md:px-10 py-6 sm:py-10">
      <ContentColumn size="lg">
        <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase mb-8 text-center sm:text-left">
          Settings
        </h1>
        <Suspense fallback={null}>
          <GoogleCalendarSettings isConnected={isConnected} />
        </Suspense>
        <PreferencesSettings />
        <TodayReminderSettings />
        <PrivacySettings />
        <DomainSecurityInfo />
      </ContentColumn>
    </main>
  );
}
