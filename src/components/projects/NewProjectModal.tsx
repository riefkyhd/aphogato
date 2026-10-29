"use client";

import { ModalShell } from "@/components/ui/ModalShell";
import { NewProjectForm } from "@/app/dashboard/new/NewProjectForm";

export function NewProjectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      titleId="new-project-modal-title"
      maxWidthClassName="max-w-lg"
    >
      <div className="flex items-center justify-between pb-3 border-b border-border mb-5">
        <h2
          id="new-project-modal-title"
          className="text-lg font-light tracking-[0.05em] uppercase"
        >
          New Project
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted hover:text-text-primary text-[11px] uppercase tracking-label transition-colors"
        >
          Close
        </button>
      </div>
      <NewProjectForm />
    </ModalShell>
  );
}
