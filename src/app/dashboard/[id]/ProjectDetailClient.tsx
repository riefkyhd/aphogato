"use client";

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
import { Button } from "@/components/ui/Button";
import { usePhotoDropZone } from "@/hooks/usePhotoDropZone";
import { useManagePhotoActivation } from "@/hooks/useManagePhotoActivation";
import { usePhotoManageSelection } from "@/hooks/usePhotoManageSelection";
import { useProjectPhotoUpload } from "@/hooks/useProjectPhotoUpload";
import { useSyncServerPhotos } from "@/hooks/useSyncServerPhotos";
import { sortPhotosNewestFirst } from "@/lib/sortPhotos";
import { ProjectActions } from "./ProjectActions";
import { ProjectMaxSelection } from "./ProjectMaxSelection";
import {
  isOverSelectionLimit,
  normalizeMaxPhotoSelection,
} from "@/lib/photoSelectionLimit";
import type { Photo, Project } from "@/lib/types";

export function ProjectDetailClient({
  project,
  initialPhotos,
}: {
  project: Project;
  initialPhotos: Photo[];
}) {
  const router = useRouter();
  const [projectState, setProjectState] = useState(project);
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

  const maxSelection = normalizeMaxPhotoSelection(
    projectState.max_photo_selection
  );

  const clientSelectedCount = useMemo(
    () => photos.filter((ph) => ph.is_selected).length,
    [photos]
  );

  const clientOverLimit = isOverSelectionLimit(
    clientSelectedCount,
    maxSelection
  );

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
        projectName={project.name}
        photoCount={photos.length}
        deleting={deletingProject}
        onClose={() => setDeleteProjectOpen(false)}
        onConfirm={confirmDeleteProject}
      />

      <main className="px-4 sm:px-6 md:px-10 py-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <BackNavLink
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            All projects
          </BackNavLink>
          <Button
            type="button"
            variant="secondary"
            className="!text-[11px] !text-status-editing !border-status-editing/50 hover:!border-status-editing"
            onClick={() => setDeleteProjectOpen(true)}
          >
            Delete project
          </Button>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-[0.05em] uppercase break-words">
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
            upload={upload}
          />
        </div>

        <div className="mb-6 max-w-md">
          <ProjectMaxSelection
            project={projectState}
            clientSelectedCount={clientSelectedCount}
            onUpdated={setProjectState}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <p
            className={
              clientOverLimit
                ? "text-[11px] uppercase tracking-label text-status-editing"
                : "text-[11px] uppercase tracking-label text-text-secondary"
            }
          >
            {clientSelectedCount} / {maxSelection} client picks
            {photos.length > 0 ? ` · ${photos.length} in gallery` : ""}
            {clientOverLimit ? " · over limit" : ""}
          </p>
          {photos.length > 0 && (
            <>
              <p className="text-[11px] text-text-muted md:hidden">
                Tap to select multiple · Hold a photo, then tap others · Clear
                with the toolbar or Esc
              </p>
              <p className="hidden md:block text-[11px] text-text-muted">
                Grid: click to select · click outside to clear · drag on photos or
                gaps to box-select (updates live) · Ctrl+drag adds to selection ·
                Ctrl+click or long-press for multi-select · Ctrl+A select all · Esc
                clear
              </p>
            </>
          )}
        </div>

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
