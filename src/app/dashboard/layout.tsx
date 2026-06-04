import { DashboardTodayReminder } from "@/app/dashboard/DashboardTodayReminder";
import { Navbar } from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="pt-[60px] flex flex-col min-h-[calc(100vh-60px)]">
        <DashboardTodayReminder />
        {children}
      </div>
    </>
  );
}
