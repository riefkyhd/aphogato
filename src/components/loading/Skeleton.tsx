import { DashboardShell } from "@/components/layout/DashboardShell";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-bg-elevated", className)}
      aria-hidden
    />
  );
}

export function DashboardPageShell({
  children,
  className,
  label = "Loading page",
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <main
      className={cn("py-6 sm:py-10", className)}
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <DashboardShell>{children}</DashboardShell>
    </main>
  );
}
