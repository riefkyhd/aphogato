"use client";

import { FileDown, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { exportMoodboardPdf } from "@/lib/references/exportMoodboardPdf";
import type { ProjectReference } from "@/lib/types";

export function ProjectReferencesSection({
  projectId,
  projectName,
  clientName,
  compact = false,
}: {
  projectId: string;
  projectName: string;
  clientName: string | null;
  compact?: boolean;
}) {
  const [references, setReferences] = useState<ProjectReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/references`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load references");
      setReferences(Array.isArray(json) ? json : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }
      const res = await fetch(`/api/projects/${projectId}/references`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      if (Array.isArray(json.errors) && json.errors.length > 0) {
        toast.warning(json.errors.join("; "));
      }
      if (Array.isArray(json.references)) {
        setReferences(json.references as ProjectReference[]);
      } else {
        await load();
      }
      const count = json.uploaded ?? 0;
      if (count > 0) {
        toast.success(
          `Added ${count} reference${count === 1 ? "" : "s"} to moodboard`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeReference(ref: ProjectReference) {
    setReferences((prev) => prev.filter((r) => r.id !== ref.id));
    try {
      const res = await fetch(
        `/api/projects/${projectId}/references/${ref.id}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete");
      toast.success("Reference removed");
    } catch (err) {
      void load();
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleExportPdf() {
    if (references.length === 0) return;
    setExporting(true);
    try {
      await exportMoodboardPdf({
        projectName,
        clientName,
        references,
      });
      toast.success("Moodboard PDF downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-label text-text-muted">
          References / moodboard
        </p>
        <div className="flex items-center gap-2">
          {references.length > 0 && (
            <Tooltip label="Export moodboard as PDF">
              <Button
                type="button"
                variant="secondary"
                className="!px-3 !text-[11px]"
                loading={exporting}
                onClick={() => void handleExportPdf()}
                aria-label="Export moodboard PDF"
              >
                <FileDown className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                Export PDF
              </Button>
            </Tooltip>
          )}
          <Tooltip label="Upload reference images">
            <Button
              type="button"
              variant="secondary"
              className="!px-3 !text-[11px]"
              loading={uploading}
              onClick={() => inputRef.current?.click()}
              aria-label="Upload references"
            >
              <ImagePlus className="h-3.5 w-3.5 mr-1.5" aria-hidden />
              Add refs
            </Button>
          </Tooltip>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        multiple
        className="sr-only"
        onChange={(e) => void handleUpload(e.target.files)}
      />

      {loading ? (
        <p className="text-[12px] text-text-muted">Loading…</p>
      ) : references.length === 0 ? (
        <p className="text-[12px] text-text-secondary">
          Upload inspiration and reference images for this shoot. Export as a PDF
          moodboard to share with your client or team.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {references.map((ref) => (
            <div
              key={ref.id}
              className="group relative aspect-[4/3] border border-border bg-bg-secondary overflow-hidden"
            >
              <Image
                src={ref.cloudinary_url}
                alt={ref.caption ?? ref.filename}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />
              <Tooltip label="Remove reference">
                <button
                  type="button"
                  onClick={() => void removeReference(ref)}
                  className="absolute top-1 right-1 p-1.5 bg-bg-primary/90 text-text-muted hover:text-status-editing opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label="Remove reference"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
