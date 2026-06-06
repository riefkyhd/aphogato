import { cn } from "@/lib/utils";

/** Shared horizontal bounds for navbar, banners, and dashboard pages on large screens. */
export const dashboardShellClass =
  "mx-auto w-full max-w-[1400px] px-4 sm:px-6 md:px-10";

export function DashboardShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(dashboardShellClass, className)}>{children}</div>;
}

export function DashboardMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("py-6 sm:py-10", className)}>
      <DashboardShell>{children}</DashboardShell>
    </main>
  );
}
