import { DashboardMain } from "@/components/layout/DashboardShell";
import { Skeleton } from "@/components/loading/Skeleton";

export default function GalleriesLoading() {
  return (
    <DashboardMain>
      <div className="mb-6 sm:mb-8 space-y-3" aria-busy="true" aria-label="Loading galleries">
        <Skeleton className="h-4 w-16" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border border-border bg-bg-secondary p-3 space-y-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </DashboardMain>
  );
}
