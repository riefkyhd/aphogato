import { Suspense } from "react";
import { ContentColumn } from "@/components/layout/ContentColumn";
import { DashboardMain } from "@/components/layout/DashboardShell";
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
    <DashboardMain>
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
    </DashboardMain>
  );
}
