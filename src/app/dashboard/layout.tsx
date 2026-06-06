import { DashboardTodayReminder } from "@/app/dashboard/DashboardTodayReminder";
import { Navbar } from "@/components/Navbar";
import { PendingNavProvider } from "@/components/navigation/PendingNavProvider";
import { UserPreferencesProvider } from "@/components/preferences/UserPreferencesProvider";
import { PrivacyLockProvider } from "@/components/privacy/PrivacyLockProvider";
import { loadTodayEvents } from "@/lib/calendar/loadTodayEvents";
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

  const [todayEvents, bootstrap] = user
    ? await Promise.all([
        loadTodayEvents(supabase),
        loadDashboardBootstrap(supabase, user.id),
      ])
    : [[], null];

  return (
    <UserPreferencesProvider initialPreferences={bootstrap?.preferences}>
      <PrivacyLockProvider initialPinEnabled={bootstrap?.pinEnabled}>
        <PendingNavProvider>
          <Navbar
            isAuthenticated={Boolean(user)}
            shootsToday={todayEvents.length}
          />
          <div className="pt-14 md:pt-[60px] flex flex-col min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100vh-60px)]">
            <DashboardTodayReminder initialEvents={todayEvents} />
            {children}
          </div>
        </PendingNavProvider>
      </PrivacyLockProvider>
    </UserPreferencesProvider>
  );
}
