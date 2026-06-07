"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildRenamedCloudinaryFolderPath } from "@/lib/cloudinaryFolder";
import type { Photo, Project } from "@/lib/types";

export function ProjectRename({
  project,
  onUpdated,
}: {
  project: Project;
  onUpdated: (
    project: Project,
    options?: { photos?: Photo[]; folderRenamed?: boolean }
  ) => void;
}) {
  const [name, setName] = useState(project.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(project.name);
  }, [project.name]);

  const trimmed = name.trim();
  const dirty = trimmed !== project.name;

  let nextFolderPreview: string | null = null;
  if (dirty && trimmed) {
    try {
      nextFolderPreview = buildRenamedCloudinaryFolderPath(
        project.cloudinary_folder,
        trimmed
      );
    } catch {
      nextFolderPreview = null;
    }
  }

  const currentFolder = project.cloudinary_folder.replace(/^\/+|\/+$/g, "");
  const folderWillChange =
    nextFolderPreview !== null && nextFolderPreview !== currentFolder;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) {
      toast.error("Project name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Failed to rename project");
        return;
      }

      if (json.project) {
        onUpdated(json.project as Project, {
          photos: Array.isArray(json.photos) ? (json.photos as Photo[]) : undefined,
          folderRenamed: Boolean(json.folderRenamed),
        });
      }

      if (json.folderRenamed) {
        toast.success("Project renamed — Cloudinary folder updated");
      } else {
        toast.success("Project name saved");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-bg-secondary px-4 py-3 sm:px-5 sm:py-4 border-b border-border">
      <form
        onSubmit={handleSave}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <label
            htmlFor="project-rename"
            className="block text-[11px] uppercase tracking-label text-text-muted mb-2"
          >
            Project name
          </label>
          <Input
            id="project-rename"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="max-w-md"
          />
          {dirty && folderWillChange && nextFolderPreview && (
            <p className="mt-2 text-[12px] text-text-muted leading-relaxed">
              Cloudinary folder will move to{" "}
              <span className="text-text-secondary">{nextFolderPreview}</span>
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          loading={saving}
          disabled={saving || !dirty || !trimmed}
          className="shrink-0"
        >
          Save name
        </Button>
      </form>
    </div>
  );
}
