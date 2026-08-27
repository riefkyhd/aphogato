import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/layout/DashboardChrome";
import { UserPreferencesProvider } from "@/components/preferences/UserPreferencesProvider";
import { PrivacyLockProvider } from "@/components/privacy/PrivacyLockProvider";
import { loadDashboardBootstrap } from "@/lib/dashboard/loadDashboardBootstrap";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bootstrap = await loadDashboardBootstrap(supabase, user.id);

  return (
    <UserPreferencesProvider initialPreferences={bootstrap.preferences}>
      <PrivacyLockProvider initialPinEnabled={bootstrap.pinEnabled}>
        <DashboardChrome>{children}</DashboardChrome>
      </PrivacyLockProvider>
    </UserPreferencesProvider>
  );
}
