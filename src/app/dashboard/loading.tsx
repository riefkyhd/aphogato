import { DashboardMain } from "@/components/layout/DashboardShell";
import { Skeleton } from "@/components/loading/Skeleton";

export default function DashboardLoading() {
  return (
    <DashboardMain>
      <div className="mb-6 sm:mb-8 space-y-3" aria-busy="true" aria-label="Loading home">
        <Skeleton className="h-8 w-32 mx-auto sm:mx-0" />
        <Skeleton className="h-4 w-full max-w-md mx-auto sm:mx-0" />
      </div>
      <Skeleton className="h-40 w-full mb-6 sm:mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[2px] mb-6 sm:mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-36 w-full mb-6 sm:mb-8" />
      <Skeleton className="h-48 w-full" />
    </DashboardMain>
  );
}
