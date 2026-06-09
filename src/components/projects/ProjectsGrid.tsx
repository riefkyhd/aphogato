"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard, type ProjectCardData } from "@/components/ProjectCard";
import {
  clearProjectsStatusDirty,
  isProjectsStatusDirty,
} from "@/lib/projects/invalidateProjectsViews";

export function ProjectsGrid({
  projects: initialProjects,
}: {
  projects: ProjectCardData[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    if (!isProjectsStatusDirty()) return;
    clearProjectsStatusDirty();
    router.refresh();
  }, [router]);

  return (
    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-[2px]">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
