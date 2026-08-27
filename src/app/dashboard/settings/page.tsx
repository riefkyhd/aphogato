import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { ContentColumn } from "@/components/layout/ContentColumn";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { SettingsAccordionSection } from "@/components/settings/SettingsAccordionSection";
import { FEATURES } from "@/lib/features";
import { PORTFOLIO_URL } from "@/lib/navConfig";
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

  const storageDefaultOpen = !FEATURES.photographerFirstUi;

  return (
    <DashboardMain>
      <ContentColumn size="lg">
        <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase mb-6 sm:mb-8 text-center sm:text-left">
          Settings
        </h1>

        <div className="space-y-6">
          <SettingsAccordionSection
            title="Workflow"
            description="Calendar sync, defaults, reminders, and privacy for your daily admin."
            defaultOpen
          >
            {FEATURES.googleCalendarSync ? (
              <Suspense fallback={null}>
                <GoogleCalendarSettings
                  isConnected={isConnected}
                  isOAuthConfigured={isOAuthConfigured}
                />
              </Suspense>
            ) : null}
            <PreferencesSettings />
            {FEATURES.todayShootsReminder ? <TodayReminderSettings /> : null}
            {FEATURES.privacyLock ? <PrivacySettings /> : null}
          </SettingsAccordionSection>

          {FEATURES.cloudinarySettings || FEATURES.imagekitStorage ? (
            <SettingsAccordionSection
              title="Storage & delivery"
              description="Cloudinary and ImageKit — for client galleries and photo delivery."
              defaultOpen={storageDefaultOpen}
            >
              {FEATURES.cloudinarySettings ? <CloudinarySettings /> : null}
              {FEATURES.imagekitStorage ? <ImageKitSettings /> : null}
            </SettingsAccordionSection>
          ) : null}

          {FEATURES.domainVerification ? (
            <SettingsAccordionSection
              title="Site"
              description="Domain and security for your public gallery links."
              defaultOpen={false}
            >
              <DomainSecurityInfo />
            </SettingsAccordionSection>
          ) : null}
        </div>

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
