import { DashboardPageShell } from "@/components/loading/Skeleton";
import { Skeleton } from "@/components/loading/Skeleton";

export default function InvoicesLoading() {
  return (
    <DashboardPageShell label="Loading invoice">
      <Skeleton className="h-4 w-24 mb-6" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-full max-w-xl mb-8" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
        <Skeleton className="h-[520px] w-full" />
      </div>
    </DashboardPageShell>
  );
}
