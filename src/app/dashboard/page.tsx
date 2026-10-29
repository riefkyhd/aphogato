import { Suspense } from "react";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { ProjectsGridSkeleton } from "@/components/loading/dashboard-skeletons";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import { ProjectsGridSection } from "@/app/dashboard/ProjectsGridSection";
import { ProjectBoardClient } from "@/components/projects/ProjectBoardClient";
import { loadBoardProjects } from "@/lib/projects/loadBoardProjects";
import { createServerSupabase } from "@/lib/supabase/server";
import { FEATURES } from "@/lib/features";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const isPipeline = searchParams?.view === "pipeline";

  if (isPipeline && FEATURES.projectPipeline) {
    const supabase = createServerSupabase();
    const projects = await loadBoardProjects(supabase);
    return (
      <DashboardMain>
        <ProjectsPageHeader title="Projects" />
        <ProjectBoardClient initialProjects={projects} />
      </DashboardMain>
    );
  }

  return (
    <DashboardMain>
      <ProjectsPageHeader title="Projects" />
      <Suspense fallback={<ProjectsGridSkeleton />}>
        <ProjectsGridSection />
      </Suspense>
    </DashboardMain>
  );
}
