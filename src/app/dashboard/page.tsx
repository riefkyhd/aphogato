import { createServerSupabase } from "@/lib/supabase/server";
import { NavigatingLink } from "@/components/NavigatingLink";
import { RefreshRouteOnMount } from "@/components/RefreshRouteOnMount";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import {
  ProjectCard,
  type ProjectCardData,
} from "@/components/ProjectCard";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadProjects(): Promise<ProjectCardData[]> {
  const supabase = createServerSupabase();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !projects) return [];

  const ids = projects.map((p) => p.id);
  if (ids.length === 0) return [];

  const { data: photos } = await supabase
    .from("photos")
    .select("project_id, cloudinary_url, created_at")
    .in("project_id", ids)
    .order("created_at", { ascending: true });

  const coverByProject = new Map<string, string>();
  const countByProject = new Map<string, number>();
  for (const p of photos ?? []) {
    countByProject.set(p.project_id, (countByProject.get(p.project_id) ?? 0) + 1);
    if (!coverByProject.has(p.project_id)) {
      coverByProject.set(p.project_id, p.cloudinary_url);
    }
  }

  return projects.map((p) => ({
    ...(p as Project),
    cover: coverByProject.has(p.id)
      ? { cloudinary_url: coverByProject.get(p.id)! }
      : null,
    photo_count: countByProject.get(p.id) ?? 0,
  }));
}

export default async function DashboardPage() {
  const projects = await loadProjects();

  return (
    <main className="px-4 sm:px-6 md:px-10 py-6 sm:py-10">
      <RefreshRouteOnMount />
      <ProjectsPageHeader />

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-[2px]">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="border border-border bg-bg-secondary p-16 text-center">
      <p className="text-text-secondary text-[14px]">
        No projects yet.
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-label text-text-muted">
        Create your first project to get started.
      </p>
      <NavigatingLink
        href="/dashboard/new"
        className="btn-primary inline-flex mt-8"
        loadingLabel="Opening…"
      >
        New project
      </NavigatingLink>
    </div>
  );
}
