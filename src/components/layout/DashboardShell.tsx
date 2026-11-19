import { cn } from "@/lib/utils";

/** Shared horizontal bounds for navbar, banners, and dashboard pages on large screens. */
export const dashboardShellClass =
  "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10";

export function DashboardShell({
  children,
  className,
  fullWidth = false,
}: {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        fullWidth ? "max-w-none xl:px-10 2xl:px-12" : "max-w-[1400px] lg:px-10",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DashboardMain({
  children,
  className,
  fullWidth = false,
}: {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <main className={cn("py-5 sm:py-8 lg:py-10", className)}>
      <DashboardShell fullWidth={fullWidth}>{children}</DashboardShell>
    </main>
  );
}
