"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { BackNavLink } from "@/components/BackNavLink";
import { RefreshRouteOnMount } from "@/components/RefreshRouteOnMount";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { DeletePhotosDialog } from "@/components/DeletePhotosDialog";
import { DeleteProjectDialog } from "@/components/DeleteProjectDialog";
import { PhotoDropHint } from "@/components/PhotoDropHint";
import { PhotoGallerySection } from "@/components/PhotoGallerySection";
import { StatusDot, type ProjectStatus } from "@/components/StatusDot";
import { UploadProgressDock } from "@/components/UploadProgressDock";
import { usePhotoDropZone } from "@/hooks/usePhotoDropZone";
import { useManagePhotoActivation } from "@/hooks/useManagePhotoActivation";
import { usePhotoManageSelection } from "@/hooks/usePhotoManageSelection";
import { useProjectPhotoUpload } from "@/hooks/useProjectPhotoUpload";
import { useSyncServerPhotos } from "@/hooks/useSyncServerPhotos";
import { sortPhotosNewestFirst } from "@/lib/sortPhotos";
import { ProjectActions } from "./ProjectActions";
import { DeliverablesChecklist } from "@/components/DeliverablesChecklist";
import { ProjectReferencesSection } from "@/components/ProjectReferencesSection";
import { LinkedExpensesBlock } from "@/components/finance/LinkedExpensesBlock";
import type {
  FinanceEventOption,
  FinanceProjectOption,
} from "@/lib/finance/financeOptions";
import { ProjectMaxSelection } from "./ProjectMaxSelection";
import { normalizeExpense } from "@/lib/finance/normalize";
import { filterExpensesForProject } from "@/lib/finance/projectExpenses";
import {
  isOverSelectionLimit,
  normalizeMaxPhotoSelection,
} from "@/lib/photoSelectionLimit";
import type { ExpenseEntry, Photo, Project } from "@/lib/types";

export function ProjectDetailClient({
  project,
  initialPhotos,
  initialProjectExpenses,
  financeEvents,
  financeProjects,
}: {
  project: Project;
  initialPhotos: Photo[];
  initialProjectExpenses: ExpenseEntry[];
  financeEvents: FinanceEventOption[];
  financeProjects: FinanceProjectOption[];
}) {
  const router = useRouter();
  const [projectState, setProjectState] = useState(project);
  const [projectExpenses, setProjectExpenses] = useState(initialProjectExpenses);
  const [photos, setPhotos] = useState(() =>
    sortPhotosNewestFirst(initialPhotos)
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const setPhotosSorted = useCallback(
    (next: Photo[]) => {
      setPhotos(sortPhotosNewestFirst(next));
      router.refresh();
    },
    [router]
  );

  useSyncServerPhotos(initialPhotos, setPhotos);

  const upload = useProjectPhotoUpload(projectState.id, setPhotosSorted);

  const photoIds = useMemo(() => photos.map((p) => p.id), [photos]);
  const manage = usePhotoManageSelection(photoIds);
  const manageActivation = useManagePhotoActivation(manage);

  const handleDropFiles = useCallback(
    (files: FileList) => {
      void upload.uploadFiles(files);
    },
    [upload]
  );

  const { isDragging, draggedFileCount } = usePhotoDropZone({
    enabled: !upload.uploading,
    onDropFiles: handleDropFiles,
  });

  const clientSelectedCount = useMemo(
    () => photos.filter((ph) => ph.is_selected).length,
    [photos]
  );

  const clientOverLimit = isOverSelectionLimit(
    clientSelectedCount,
    normalizeMaxPhotoSelection(projectState.max_photo_selection)
  );

  const eventIdsForProject = useMemo(() => {
    const ids = new Set<string>();
    for (const ev of financeEvents) {
      if (ev.project_id === projectState.id) ids.add(ev.id);
    }
    return ids;
  }, [financeEvents, projectState.id]);

  const refreshProjectExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/finance/expenses");
      const json = await res.json();
      if (!res.ok || !Array.isArray(json)) return;
      const all = json.map((row: ExpenseEntry) => normalizeExpense(row));
      setProjectExpenses(
        filterExpensesForProject(all, projectState.id, eventIdsForProject)
      );
      router.refresh();
    } catch {
      // ignore
    }
  }, [projectState.id, eventIdsForProject, router]);

  const clientSelectedIds = useMemo(
    () => new Set(photos.filter((ph) => ph.is_selected).map((ph) => ph.id)),
    [photos]
  );

  const photosToDelete = useMemo(
    () => photos.filter((ph) => manage.manageSelected.has(ph.id)),
    [photos, manage.manageSelected]
  );

  const clientPicksInDelete = useMemo(
    () => photosToDelete.filter((ph) => ph.is_selected),
    [photosToDelete]
  );

  async function confirmDeletePhotos() {
    if (photosToDelete.length === 0) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectState.id}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: photosToDelete.map((p) => p.id),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Failed to delete photos");
        return;
      }
      if (Array.isArray(json.errors) && json.errors.length > 0) {
        toast.warning(json.errors.join("; "));
      }
      const deleted = json.deleted ?? photosToDelete.length;
      toast.success(
        `Deleted ${deleted} photo${deleted === 1 ? "" : "s"}`
      );
      if (Array.isArray(json.photos)) {
        setPhotosSorted(json.photos as Photo[]);
      }
      manageActivation.clearAll();
      setDeleteDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function confirmDeleteProject() {
    setDeletingProject(true);
    try {
      const res = await fetch(`/api/projects/${projectState.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Failed to delete project");
        return;
      }
      if (Array.isArray(json.cloudinaryErrors) && json.cloudinaryErrors.length > 0) {
        toast.warning("Some Cloudinary assets could not be removed");
      }
      toast.success("Project deleted");
      setDeleteProjectOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingProject(false);
    }
  }

  return (
    <>
      <RefreshRouteOnMount />
      {isDragging && (
        <PhotoDropHint
          projectName={projectState.name}
          fileCount={draggedFileCount}
        />
      )}
      {upload.uploading && upload.progress && (
        <UploadProgressDock progress={upload.progress} />
      )}

      <DeletePhotosDialog
        open={deleteDialogOpen}
        photos={photosToDelete}
        clientSelectedPhotos={clientPicksInDelete}
        deleting={deleting}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeletePhotos}
      />

      <DeleteProjectDialog
        open={deleteProjectOpen}
        projectName={projectState.name}
        photoCount={photos.length}
        deleting={deletingProject}
        onClose={() => setDeleteProjectOpen(false)}
        onConfirm={confirmDeleteProject}
      />

      <main className="px-4 sm:px-6 md:px-10 py-6 sm:py-10">
        <BackNavLink
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          All projects
        </BackNavLink>

        <header className="border-b border-border pb-6 mb-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-light tracking-[0.05em] uppercase break-words">
                {projectState.name}
              </h1>
              <p className="mt-2 text-text-secondary text-[14px]">
                {projectState.client_name ?? "—"}
              </p>
              <div className="mt-3">
                <StatusDot status={projectState.status as ProjectStatus} />
              </div>
            </div>
            <ProjectActions
              projectId={projectState.id}
              galleryToken={projectState.gallery_token}
              status={projectState.status as ProjectStatus}
              photos={photos}
              onPhotosSynced={setPhotosSorted}
              onDeleteProject={() => setDeleteProjectOpen(true)}
              upload={upload}
            />
          </div>

          <div className="mt-6 space-y-4">
            <ProjectMaxSelection
              project={projectState}
              clientSelectedCount={clientSelectedCount}
              photoCount={photos.length}
              clientOverLimit={clientOverLimit}
              onUpdated={setProjectState}
            />
            <LinkedExpensesBlock
              expenses={projectExpenses}
              events={financeEvents}
              projects={financeProjects}
              defaultProjectId={projectState.id}
              defaultDate={format(new Date(), "yyyy-MM-dd")}
              onChanged={() => void refreshProjectExpenses()}
              compact
            />
            <div className="border border-border p-4">
              <DeliverablesChecklist projectId={projectState.id} compact />
            </div>
            <div className="border border-border p-4">
              <ProjectReferencesSection
                projectId={projectState.id}
                projectName={projectState.name}
                clientName={projectState.client_name}
                compact
              />
            </div>
          </div>
        </header>

        {photos.length > 0 && (
          <p className="mb-4 text-[11px] text-text-muted leading-relaxed max-w-3xl">
            <span className="md:hidden">
              Tap or long-press photos to multi-select for delete. Esc clears
              selection.
            </span>
            <span className="hidden md:inline">
              Click to select · drag to box-select · Ctrl+click or long-press for
              multi-select · Esc to clear.
            </span>
          </p>
        )}

        <div
          className="select-none"
          onSelectCapture={(e) => {
            if (manage.count > 0) e.preventDefault();
          }}
        >
          <PhotoGallerySection
            photos={photos}
            mode="dashboard"
            viewStorageId={projectState.gallery_token}
            selectedIds={clientSelectedIds}
            manageSelectedIds={manage.manageSelected}
            onManagePhotoActivate={manageActivation.activate}
            onManagePhotoMarquee={manage.setMarqueeHits}
            managePreviewId={manageActivation.previewId}
            onClearManageSelection={manageActivation.clearAll}
            onDeletePhotos={() => setDeleteDialogOpen(true)}
          />
        </div>

        <p className="mt-6 text-[12px] text-text-muted leading-relaxed">
          {photos.length === 0
            ? "Drag photos anywhere on this page, or use Upload photos. Then share the gallery link with your client."
            : "Your client selects favorites from the gallery link."}
        </p>
      </main>
    </>
  );
}
