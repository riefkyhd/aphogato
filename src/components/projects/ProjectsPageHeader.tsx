"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FEATURES } from "@/lib/features";
import { ProjectsViewToggle } from "@/components/projects/ProjectsViewToggle";
import { NewProjectModal } from "@/components/projects/NewProjectModal";

export function ProjectsPageHeader({
  title = "Projects",
}: {
  title?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase text-center sm:text-left">
            {title}
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary text-center sm:text-left">
            Unified workspace — proofing, pipeline, and client deliveries.
          </p>
        </div>
        {FEATURES.newProject ? (
          <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary w-full sm:w-auto justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              New project
            </button>
            <NewProjectModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
            />
          </div>
        ) : null}
      </div>
      {FEATURES.projectPipeline ? (
        <div className="flex justify-center sm:justify-start mt-4 sm:mt-5 border-t border-border pt-4">
          <ProjectsViewToggle />
        </div>
      ) : null}
    </div>
  );
}
