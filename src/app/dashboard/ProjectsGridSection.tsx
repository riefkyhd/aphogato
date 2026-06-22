import { NavigatingLink } from "@/components/NavigatingLink";
import { FEATURES } from "@/lib/features";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";
import { loadGridProjects } from "@/lib/projects/loadGridProjects";

export async function ProjectsGridSection() {
  const projects = await loadGridProjects();

  if (projects.length === 0) {
    return (
      <div className="border border-border bg-bg-secondary p-16 text-center">
        <p className="text-text-secondary text-[14px]">No projects yet.</p>
        <p className="mt-2 text-[11px] uppercase tracking-label text-text-muted">
          Create your first project to get started.
        </p>
        {FEATURES.newProject ? (
          <NavigatingLink
            href="/dashboard/new"
            className="btn-primary inline-flex mt-8"
            loadingLabel="Opening…"
          >
            New project
          </NavigatingLink>
        ) : null}
      </div>
    );
  }

  return <ProjectsGrid projects={projects} />;
}
