import { DashboardMain } from "@/components/layout/DashboardShell";
import { Skeleton } from "@/components/loading/Skeleton";

export default function GalleriesBoardLoading() {
  return (
    <DashboardMain>
      <div
        className="mb-6 sm:mb-8 space-y-3"
        aria-busy="true"
        aria-label="Loading pipeline"
      >
        <Skeleton className="h-4 w-16" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[240px] flex-1 border border-border bg-bg-secondary p-3 space-y-2"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </DashboardMain>
  );
}
