import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { ContentColumn } from "@/components/layout/ContentColumn";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { FEATURES } from "@/lib/features";
import { PORTFOLIO_URL } from "@/lib/navConfig";
import { SettingsTabsClient } from "@/app/dashboard/settings/SettingsTabsClient";
import { CloudinarySettings } from "@/app/dashboard/settings/CloudinarySettings";
import { DataExportSettings } from "@/app/dashboard/settings/DataExportSettings";
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

  const connectionsNode = (
    <div className="space-y-6">
      {FEATURES.googleCalendarSync ? (
        <Suspense fallback={null}>
          <GoogleCalendarSettings
            isConnected={isConnected}
            isOAuthConfigured={isOAuthConfigured}
          />
        </Suspense>
      ) : null}
      {FEATURES.cloudinarySettings ? <CloudinarySettings /> : null}
      {FEATURES.imagekitStorage ? <ImageKitSettings /> : null}
    </div>
  );

  const studioNode = (
    <div className="space-y-6">
      {FEATURES.privacyLock ? <PrivacySettings /> : null}
      <PreferencesSettings />
      {FEATURES.todayShootsReminder ? <TodayReminderSettings /> : null}
    </div>
  );

  const dataNode = (
    <div className="space-y-6">
      {FEATURES.domainVerification ? <DomainSecurityInfo /> : null}
      <DataExportSettings />
    </div>
  );

  return (
    <DashboardMain>
      <ContentColumn size="lg">
        <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase mb-4 sm:mb-6 text-center sm:text-left">
          Settings
        </h1>

        <SettingsTabsClient
          connectionsNode={connectionsNode}
          studioNode={studioNode}
          dataNode={dataNode}
        />

        <footer className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-border">
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
          >
            View portfolio
            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </a>
        </footer>
      </ContentColumn>
    </DashboardMain>
  );
}
