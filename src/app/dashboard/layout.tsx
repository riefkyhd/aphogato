import { DashboardTodayReminder } from "@/app/dashboard/DashboardTodayReminder";
import { Navbar } from "@/components/Navbar";
import { PrivacyLockProvider } from "@/components/privacy/PrivacyLockProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivacyLockProvider>
      <Navbar />
      <div className="pt-14 md:pt-[60px] flex flex-col min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100vh-60px)]">
        <DashboardTodayReminder />
        {children}
      </div>
    </PrivacyLockProvider>
  );
}
