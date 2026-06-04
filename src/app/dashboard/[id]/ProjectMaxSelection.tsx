"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  MAX_MAX_PHOTO_SELECTION,
  MIN_MAX_PHOTO_SELECTION,
} from "@/lib/photoSelectionLimit";
import type { Project } from "@/lib/types";

export function ProjectMaxSelection({
  project,
  clientSelectedCount,
  onUpdated,
}: {
  project: Project;
  clientSelectedCount: number;
  onUpdated: (project: Project) => void;
}) {
  const [value, setValue] = useState(String(project.max_photo_selection));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(String(project.max_photo_selection));
  }, [project.max_photo_selection]);

  const overLimit = clientSelectedCount > project.max_photo_selection;

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
        toast.success("Max selection updated");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-3"
    >
      <div>
        <Label htmlFor="max-selection">Max photos client can select</Label>
        <Input
          id="max-selection"
          type="number"
          min={MIN_MAX_PHOTO_SELECTION}
          max={MAX_MAX_PHOTO_SELECTION}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 max-w-[8rem]"
        />
        <p className="mt-2 text-[12px] text-text-muted leading-relaxed">
          Shown on the gallery link. Clients cannot select or save more than this
          number.
        </p>
      </div>
      {overLimit && (
        <p className="text-[12px] text-status-editing leading-relaxed" role="status">
          Client has {clientSelectedCount} selected but the limit is{" "}
          {project.max_photo_selection}. They must deselect extras before saving
          again, or raise the limit.
        </p>
      )}
      <Button type="submit" loading={saving} disabled={saving} className="!text-[11px]">
        Save limit
      </Button>
    </form>
  );
}
