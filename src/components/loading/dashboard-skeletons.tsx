import { Skeleton, DashboardPageShell } from "@/components/loading/Skeleton";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function PageTitleSkeleton({ withSubtitle = true }: { withSubtitle?: boolean }) {
  return (
    <div className="mb-6 sm:mb-8">
      <Skeleton className="h-7 w-40 sm:h-8 sm:w-48" />
      {withSubtitle ? <Skeleton className="mt-3 h-4 w-full max-w-md" /> : null}
    </div>
  );
}

function ToolbarSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 sm:w-28" />
      ))}
    </div>
  );
}

export function ProjectsSkeleton() {
  return (
    <DashboardPageShell label="Loading projects">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-7 w-32 sm:h-8" />
          <Skeleton className="h-10 w-full sm:w-36" />
        </div>
        <div className="flex justify-center mt-4 sm:mt-5">
          <Skeleton className="h-10 w-52" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-[2px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[5/3] min-[480px]:aspect-[3/2]" />
          ))}
        </div>
      </div>
    </DashboardPageShell>
  );
}

export function BoardSkeleton() {
  return (
    <DashboardPageShell
      className="flex flex-col min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100vh-60px)]"
      label="Loading pipeline"
    >
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-7 w-36 sm:h-8" />
          <Skeleton className="h-10 w-full sm:w-36" />
        </div>
        <div className="flex justify-center mt-4 sm:mt-5">
          <Skeleton className="h-10 w-52" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex gap-3 w-max mx-auto overflow-hidden pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-[272px] shrink-0 border border-border bg-bg-primary/40"
          >
            <div className="border-b border-border px-3 py-3 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="p-2 space-y-2">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          </div>
        ))}
      </div>
    </DashboardPageShell>
  );
}

export function CalendarSkeleton() {
  return (
    <DashboardPageShell
      className="min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100vh-60px)] flex flex-col"
      label="Loading calendar"
    >
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Skeleton className="h-7 w-32 sm:h-8" />
        <ToolbarSkeleton count={4} />
      </div>
      <Skeleton className="h-16 w-full mb-4 rounded-sm" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-border pb-4">
        <Skeleton className="h-9 w-48 mx-auto sm:mx-0" />
        <Skeleton className="h-10 w-full sm:w-44" />
      </div>
      <div className="flex-1 border border-border">
        <div className="grid grid-cols-7 border-b border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-none" />
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr min-h-[320px] sm:min-h-[400px]">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="border border-border p-2 space-y-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </DashboardPageShell>
  );
}

export function FinanceSkeleton() {
  return (
    <DashboardPageShell label="Loading finance">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
        <PageTitleSkeleton />
        <ToolbarSkeleton count={4} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2px] mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-3 w-28 mb-3" />
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-[2px] mb-6">
        {MONTH_LABELS.map((label) => (
          <div
            key={label}
            className="border border-border bg-bg-secondary p-2 sm:p-3 min-h-[72px] space-y-2"
          >
            <Skeleton className="h-2.5 w-8" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="border border-border bg-bg-secondary min-h-[280px] p-4 space-y-3"
          >
            <Skeleton className="h-3 w-20" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-12 w-full" />
            ))}
          </div>
        ))}
      </div>
    </DashboardPageShell>
  );
}

export function ClientsSkeleton() {
  return (
    <DashboardPageShell label="Loading clients">
      <Skeleton className="h-4 w-28 mb-6" />
      <header className="mb-8 border-b border-border pb-6 space-y-3">
        <Skeleton className="h-7 w-40 sm:h-8" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8">
        <div className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4 h-fit">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="border border-border bg-bg-secondary min-h-[320px] p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </DashboardPageShell>
  );
}

export function PricingSkeleton() {
  return (
    <DashboardPageShell label="Loading pricing">
      <Skeleton className="h-4 w-28 mb-6" />
      <header className="mb-8 border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-7 w-36 sm:h-8" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
          <ToolbarSkeleton count={2} />
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8">
        <div className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4 h-fit">
          <Skeleton className="h-3 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="border border-border bg-bg-secondary min-h-[320px] p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </DashboardPageShell>
  );
}

export function SettingsSkeleton() {
  return (
    <DashboardPageShell label="Loading settings">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Skeleton className="h-7 w-32 sm:h-8 mx-auto sm:mx-0" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border border-border bg-bg-secondary p-6 space-y-4"
          >
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-10 w-40" />
          </div>
        ))}
      </div>
    </DashboardPageShell>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <DashboardPageShell className="max-w-[1400px] mx-auto" label="Loading project">
      <Skeleton className="h-4 w-28 mb-6" />
      <header className="mb-8 space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-9 w-full max-w-lg" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:max-w-md">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 sm:w-28" />
            ))}
          </div>
        </div>
        <Skeleton className="h-12 w-full border border-border" />
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[2px]">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/2]" />
        ))}
      </div>
    </DashboardPageShell>
  );
}

export function NewProjectSkeleton() {
  return (
    <DashboardPageShell
      className="max-w-[560px] mx-auto"
      label="Loading new project form"
    >
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-full mb-10" />
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full sm:w-36" />
      </div>
    </DashboardPageShell>
  );
}
