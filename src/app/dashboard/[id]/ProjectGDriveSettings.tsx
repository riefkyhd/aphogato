"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { Project } from "@/lib/types";

export function ProjectGDriveSettings({
  project,
  onUpdated,
}: {
  project: Project;
  onUpdated: (next: Project) => void;
}) {
  const [proofsFolder, setProofsFolder] = useState(
    project.gdrive_folder_id ?? ""
  );
  const [finalsFolder, setFinalsFolder] = useState(
    project.gdrive_finals_folder_id ?? ""
  );
  const [finalsShareUrl, setFinalsShareUrl] = useState(
    project.gdrive_finals_share_url ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gdrive_folder_id: proofsFolder,
          gdrive_finals_folder_id: finalsFolder,
          gdrive_finals_share_url: finalsShareUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update Google Drive settings");
        return;
      }

      toast.success("Google Drive folders updated");
      if (json.project) {
        onUpdated(json.project);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="border-t border-border bg-bg-secondary p-4 sm:p-5 space-y-4"
    >
      <div>
        <h3 className="text-[11px] uppercase tracking-label text-text-secondary mb-1">
          Google Drive Folders
        </h3>
        <p className="text-[12px] text-text-muted leading-relaxed">
          Sync raw Proofs and Lightroom Edited Finals directly from your Google Drive.
        </p>
      </div>

      <div>
        <Label htmlFor="gdrive-proofs-folder">Proofs Folder (URL or ID)</Label>
        <Input
          id="gdrive-proofs-folder"
          placeholder="https://drive.google.com/drive/folders/..."
          value={proofsFolder}
          onChange={(e) => setProofsFolder(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="gdrive-finals-folder">Finals Folder (URL or ID)</Label>
        <Input
          id="gdrive-finals-folder"
          placeholder="https://drive.google.com/drive/folders/..."
          value={finalsFolder}
          onChange={(e) => setFinalsFolder(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="gdrive-finals-share">Client Direct Drive Link (Optional)</Label>
        <Input
          id="gdrive-finals-share"
          placeholder="Optional direct sharing link for full-resolution client downloads"
          value={finalsShareUrl}
          onChange={(e) => setFinalsShareUrl(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={saving} disabled={saving}>
          Save Drive settings
        </Button>
      </div>
    </form>
  );
}
