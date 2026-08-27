import { Suspense } from "react";
import { FEATURES } from "@/lib/features";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { ProjectsGridSkeleton } from "@/components/loading/dashboard-skeletons";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import { ProjectsGridSection } from "@/app/dashboard/ProjectsGridSection";

export const dynamic = "force-dynamic";

export default function GalleriesPage() {
  return (
    <DashboardMain>
      {FEATURES.projectsGrid ? (
        <>
          <ProjectsPageHeader title="Galleries" />

          <Suspense fallback={<ProjectsGridSkeleton />}>
            <ProjectsGridSection />
          </Suspense>
        </>
      ) : null}
    </DashboardMain>
  );
}
