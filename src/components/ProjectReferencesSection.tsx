"use client";

import { FileDown, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/loading/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { uploadProjectReferenceViaCloudinary } from "@/lib/directCloudinaryClientUpload";
import { filterImageUploadFiles } from "@/lib/imageUploadFiles";
import { useConfirmAction } from "@/lib/hooks/useConfirmAction";
import { useUndoableDelete } from "@/lib/hooks/useUndoableDelete";
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
  const confirmAction = useConfirmAction();
  const undoableDelete = useUndoableDelete();

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
    const entries = filterImageUploadFiles(files);
    if (entries.length === 0) {
      toast.error("No supported image files to upload");
      return;
    }

    setUploading(true);
    try {
      let uploaded = 0;
      const errors: string[] = [];
      let latestReferences: ProjectReference[] | null = null;

      for (const file of entries) {
        const result = await uploadProjectReferenceViaCloudinary(
          projectId,
          file
        );
        uploaded += result.uploaded;
        if (result.errors.length > 0) {
          errors.push(...result.errors);
        }
        if (result.references.length > 0) {
          latestReferences = result.references;
        }
      }

      if (errors.length > 0) {
        toast.warning(errors.join("; "));
      }
      if (latestReferences) {
        setReferences(latestReferences);
      } else if (uploaded > 0) {
        await load();
      }
      if (uploaded > 0) {
        toast.success(
          `Added ${uploaded} reference${uploaded === 1 ? "" : "s"} to moodboard`
        );
      } else if (errors.length === 0) {
        toast.error("Upload failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function requestRemoveReference(ref: ProjectReference) {
    confirmAction.request({
      title: "Remove reference?",
      description:
        "This image will be removed from the moodboard. You'll have 5 seconds to undo before it's deleted permanently.",
      confirmLabel: "Remove",
      destructive: true,
      run: () => performRemoveReference(ref),
    });
  }

  function performRemoveReference(ref: ProjectReference) {
    const previous = references;
    undoableDelete.trigger({
      message: "Reference removed",
      optimisticRemove: () =>
        setReferences((prev) => prev.filter((r) => r.id !== ref.id)),
      restore: () => setReferences(previous),
      commit: async () => {
        const res = await fetch(
          `/api/projects/${projectId}/references/${ref.id}`,
          { method: "DELETE" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to delete");
      },
      onError: () => {
        void load();
      },
    });
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
      <ConfirmDialog
        open={confirmAction.open}
        title={confirmAction.title}
        description={confirmAction.description}
        confirmLabel={confirmAction.confirmLabel}
        destructive={confirmAction.destructive}
        confirming={confirmAction.confirming}
        onClose={confirmAction.close}
        onConfirm={confirmAction.confirm}
      />
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
                size="sm"
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
              size="sm"
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
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
          aria-busy="true"
          aria-label="Loading references"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full" />
          ))}
        </div>
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
                  onClick={() => requestRemoveReference(ref)}
                  className="absolute top-1 right-1 p-1.5 bg-bg-primary/90 text-text-muted hover:text-status-editing transition-opacity opacity-90 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 md:focus-within:opacity-100"
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
