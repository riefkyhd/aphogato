"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  MAX_MAX_PHOTO_SELECTION,
  MIN_MAX_PHOTO_SELECTION,
} from "@/lib/photoSelectionLimit";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

export function ProjectMaxSelection({
  project,
  clientSelectedCount,
  photoCount,
  clientOverLimit,
  onUpdated,
}: {
  project: Project;
  clientSelectedCount: number;
  photoCount: number;
  clientOverLimit: boolean;
  onUpdated: (project: Project) => void;
}) {
  const [value, setValue] = useState(String(project.max_photo_selection));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(String(project.max_photo_selection));
  }, [project.max_photo_selection]);

  const dirty = Number(value) !== project.max_photo_selection;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_photo_selection: Number(value) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update limit");
        return;
      }
      if (json.project) {
        onUpdated(json.project as Project);
        toast.success("Selection limit saved");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-border bg-bg-secondary px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form
          onSubmit={handleSave}
          className="flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          <span className="text-[11px] uppercase tracking-label text-text-muted shrink-0">
            Client selection limit
          </span>
          <Input
            id="max-selection"
            type="number"
            min={MIN_MAX_PHOTO_SELECTION}
            max={MAX_MAX_PHOTO_SELECTION}
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Max photos client can select"
            className="w-[5.5rem] h-9 text-center tabular-nums"
          />
          <Button
            type="submit"
            variant="secondary"
            loading={saving}
            disabled={saving || !dirty}
            className="!text-[11px] !px-3 !py-2"
          >
            Save
          </Button>
        </form>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-label">
          <div className="flex items-center gap-2">
            <dt className="text-text-muted">Client selections</dt>
            <dd
              className={cn(
                "tabular-nums",
                clientOverLimit ? "text-status-editing" : "text-text-primary"
              )}
            >
              {clientSelectedCount} / {project.max_photo_selection}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-text-muted">Gallery</dt>
            <dd className="text-text-primary tabular-nums">
              {photoCount} photo{photoCount === 1 ? "" : "s"}
            </dd>
          </div>
        </dl>
      </div>

      {clientOverLimit && (
        <p
          className="mt-3 text-[12px] text-status-editing leading-relaxed border-t border-border pt-3"
          role="status"
        >
          Client is over the limit ({clientSelectedCount} selected). They must
          deselect extras before saving, or raise the limit above.
        </p>
      )}
    </div>
  );
}
