import { Suspense } from "react";
import { ContentColumn } from "@/components/layout/ContentColumn";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { FEATURES } from "@/lib/features";
import { CloudinarySettings } from "@/app/dashboard/settings/CloudinarySettings";
import { ImageKitSettings } from "@/app/dashboard/settings/ImageKitSettings";
import { DomainSecurityInfo } from "@/app/dashboard/settings/DomainSecurityInfo";
import { GoogleCalendarSettings } from "@/app/dashboard/settings/GoogleCalendarSettings";
import { PreferencesSettings } from "@/app/dashboard/settings/PreferencesSettings";
import { PrivacySettings } from "@/app/dashboard/settings/PrivacySettings";
import { TodayReminderSettings } from "@/app/dashboard/settings/TodayReminderSettings";
import { isGoogleOAuthConfigured } from "@/lib/calendar/googleOAuthConfig";
import { isGoogleCalendarConnected } from "@/lib/calendar/googleSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!FEATURES.settings) return null;

  const [isConnected, isOAuthConfigured] = await Promise.all([
    isGoogleCalendarConnected(),
    Promise.resolve(isGoogleOAuthConfigured()),
  ]);

  return (
    <DashboardMain>
      <ContentColumn size="lg">
        <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase mb-8 text-center sm:text-left">
          Settings
        </h1>
        {FEATURES.googleCalendarSync ? (
          <Suspense fallback={null}>
            <GoogleCalendarSettings
              isConnected={isConnected}
              isOAuthConfigured={isOAuthConfigured}
            />
          </Suspense>
        ) : null}
        <PreferencesSettings />
        {FEATURES.cloudinarySettings ? <CloudinarySettings /> : null}
        {FEATURES.imagekitStorage ? <ImageKitSettings /> : null}
        {FEATURES.todayShootsReminder ? <TodayReminderSettings /> : null}
        {FEATURES.privacyLock ? <PrivacySettings /> : null}
        {FEATURES.domainVerification ? <DomainSecurityInfo /> : null}
      </ContentColumn>
    </DashboardMain>
  );
}
