import { createServerSupabase } from "@/lib/supabase/server";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { NavigatingLink } from "@/components/NavigatingLink";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import {
  ProjectCard,
  type ProjectCardData,
} from "@/components/ProjectCard";
import { loadProjectPhotoStats } from "@/lib/projects/loadProjectPhotoStats";
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

  const photoStats = await loadProjectPhotoStats(supabase, ids);

  return projects.map((p) => {
    const stats = photoStats.get(p.id);
    return {
      ...(p as Project),
      cover: stats?.cover_url ? { cloudinary_url: stats.cover_url } : null,
      photo_count: stats?.photo_count ?? 0,
    };
  });
}

export default async function DashboardPage() {
  const projects = await loadProjects();

  return (
    <DashboardMain>
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
    </DashboardMain>
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
