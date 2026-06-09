import { DashboardChrome } from "@/components/layout/DashboardChrome";
import { UserPreferencesProvider } from "@/components/preferences/UserPreferencesProvider";
import { PrivacyLockProvider } from "@/components/privacy/PrivacyLockProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserPreferencesProvider>
      <PrivacyLockProvider>
        <DashboardChrome>{children}</DashboardChrome>
      </PrivacyLockProvider>
    </UserPreferencesProvider>
  );
}
