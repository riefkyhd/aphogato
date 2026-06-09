import { Suspense } from "react";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { ProjectsGridSkeleton } from "@/components/loading/dashboard-skeletons";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import { ProjectsGridSection } from "@/app/dashboard/ProjectsGridSection";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <DashboardMain>
      <ProjectsPageHeader />

      <Suspense fallback={<ProjectsGridSkeleton />}>
        <ProjectsGridSection />
      </Suspense>
    </DashboardMain>
  );
}
