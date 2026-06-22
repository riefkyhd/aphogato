"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FEATURES } from "@/lib/features";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { BackNavLink } from "@/components/BackNavLink";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { DeletePhotosDialog } from "@/components/DeletePhotosDialog";
import { DeleteProjectDialog } from "@/components/DeleteProjectDialog";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import { PhotoDropHint } from "@/components/PhotoDropHint";
import { PhotoGallerySection } from "@/components/PhotoGallerySection";
import { StatusDot, type ProjectStatus } from "@/components/StatusDot";
import { CancelUploadDialog } from "@/components/CancelUploadDialog";
import { UploadProgressDock } from "@/components/UploadProgressDock";
import { usePhotoDropZone } from "@/hooks/usePhotoDropZone";
import { useManagePhotoActivation } from "@/hooks/useManagePhotoActivation";
import { usePhotoManageSelection } from "@/hooks/usePhotoManageSelection";
import { useProjectPhotoUpload } from "@/hooks/useProjectPhotoUpload";
import { useSyncServerPhotos } from "@/hooks/useSyncServerPhotos";
import { ProjectActions } from "./ProjectActions";
import { DeliverablesChecklist } from "@/components/DeliverablesChecklist";
import { ProjectReferencesSection } from "@/components/ProjectReferencesSection";
import { ProjectCloudinaryUsageBadge } from "@/components/cloudinary/ProjectCloudinaryUsageBadge";
import { ProjectCloudinaryAccountNote } from "@/components/cloudinary/ProjectCloudinaryAccountNote";
import { useProjectCloudinaryUsage } from "@/hooks/useProjectCloudinaryUsage";
import { ProjectMaxSelection } from "./ProjectMaxSelection";
import { ProjectFaceSearchSettings } from "./ProjectFaceSearchSettings";
import { ProjectRename } from "./ProjectRename";
import {
  isOverSelectionLimit,
  normalizeMaxPhotoSelection,
} from "@/lib/photoSelectionLimit";
import type { Photo, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectDetailClient({
  project,
  initialPhotos,
}: {
  project: Project;
  initialPhotos: Photo[];
}) {
  const router = useRouter();
  const { guardSensitiveAction } = usePrivacyLockContext();
  const [projectState, setProjectState] = useState(project);
  const [photos, setPhotos] = useState(initialPhotos);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    setProjectState(project);
  }, [project]);

  useEffect(() => {
    if (!FEATURES.faceSearch || !projectState.face_search_enabled) return;
    void import("@/lib/faces/faceIndexClient").then((m) =>
      m.preloadFaceIndexWorker()
    );
  }, [projectState.face_search_enabled]);

  const faceSearchActive =
    FEATURES.faceSearch && projectState.face_search_enabled;

  const setPhotosFromServer = useCallback((next: Photo[]) => {
    setPhotos(next);
  }, []);

  const refreshProjectPhotos = useCallback(() => {
    router.refresh();
  }, [router]);

  const applyServerPhotos = useCallback(
    (next: Photo[]) => {
      setPhotosFromServer(next);
      refreshProjectPhotos();
    },
    [setPhotosFromServer, refreshProjectPhotos]
  );

  useSyncServerPhotos(initialPhotos, setPhotos);

  const upload = useProjectPhotoUpload(
    projectState.id,
    setPhotosFromServer,
    refreshProjectPhotos,
    faceSearchActive
  );

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
    enabled: true,
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

  const {
    account: cloudinaryAccount,
    usage: cloudinaryUsage,
    loading: cloudinaryUsageLoading,
  } = useProjectCloudinaryUsage(projectState.cloudinary_account);

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
        applyServerPhotos(json.photos as Photo[]);
      }
      manageActivation.clearAll();
      setDeleteDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function executeDeleteProject() {
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

  function confirmDeleteProject() {
    guardSensitiveAction(() => void executeDeleteProject(), {
      title: "Delete project",
      description: "Enter your privacy PIN to permanently delete this project.",
    });
  }

  return (
    <>
      {isDragging && (
        <PhotoDropHint
          projectName={projectState.name}
          fileCount={draggedFileCount}
        />
      )}
      {upload.uploading && upload.progress && (
        <UploadProgressDock
          progress={upload.progress}
          onCancel={upload.requestCancelUpload}
        />
      )}

      {upload.cancelDialogOpen && upload.progress && (
        <CancelUploadDialog
          open={upload.cancelDialogOpen}
          progress={upload.progress}
          uploadedCount={upload.uploadedCount}
          onClose={upload.dismissCancelDialog}
          onConfirm={upload.confirmCancelUpload}
        />
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

      <DashboardMain>
        <BackNavLink
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          All projects
        </BackNavLink>

        <header className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-light tracking-[0.05em] uppercase break-words">
                {projectState.name}
              </h1>
              <p className="mt-2 text-text-secondary text-[15px]">
                {projectState.client_name ?? "—"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-label text-text-muted">
                <StatusDot status={projectState.status as ProjectStatus} />
                <span>
                  {photos.length} photo{photos.length === 1 ? "" : "s"}
                </span>
                <span>
                  {clientSelectedCount} client pick
                  {clientSelectedCount === 1 ? "" : "s"}
                </span>
                {FEATURES.cloudinarySettings ? (
                  <ProjectCloudinaryUsageBadge
                    account={cloudinaryAccount}
                    usage={cloudinaryUsage}
                    loading={cloudinaryUsageLoading}
                  />
                ) : null}
              </div>
              {FEATURES.cloudinarySettings ? (
                <ProjectCloudinaryAccountNote
                  account={cloudinaryAccount}
                  usage={cloudinaryUsage}
                  loading={cloudinaryUsageLoading}
                  photoCount={photos.length}
                />
              ) : null}
            </div>
            <ProjectActions
              projectId={projectState.id}
              galleryToken={projectState.gallery_token}
              status={projectState.status as ProjectStatus}
              photos={photos}
              cloudinaryAccount={cloudinaryAccount}
              cloudinaryUsage={cloudinaryUsage}
              cloudinaryUsageLoading={cloudinaryUsageLoading}
              onPhotosSynced={applyServerPhotos}
              onDeleteProject={() => setDeleteProjectOpen(true)}
              onStatusChange={(status) =>
                setProjectState((prev) => ({ ...prev, status }))
              }
              faceSearchEnabled={faceSearchActive}
              upload={upload}
            />
          </div>

          <div className="mt-6 border border-border bg-bg-secondary">
            <button
              type="button"
              onClick={() => setToolsOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
              aria-expanded={toolsOpen}
            >
              <span className="text-[11px] uppercase tracking-label text-text-secondary">
                Project setup
              </span>
              <span className="text-[11px] text-text-muted">
                {toolsOpen ? "Hide" : "Show"}
              </span>
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200",
                toolsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-[2px] border-t border-border">
                  <ProjectRename
                    project={projectState}
                    onUpdated={(next, options) => {
                      setProjectState(next);
                      if (options?.photos) {
                        setPhotosFromServer(options.photos);
                      }
                      if (options?.folderRenamed) {
                        refreshProjectPhotos();
                      }
                    }}
                  />
                  <ProjectMaxSelection
                    project={projectState}
                    clientSelectedCount={clientSelectedCount}
                    photoCount={photos.length}
                    clientOverLimit={clientOverLimit}
                    onUpdated={setProjectState}
                  />
                  {FEATURES.faceSearch ? (
                    <ProjectFaceSearchSettings
                      project={projectState}
                      photoCount={photos.length}
                      onUpdated={setProjectState}
                    />
                  ) : null}
                  {FEATURES.deliverables ? (
                    <div className="border-t border-border bg-bg-secondary p-4 sm:p-5">
                      <DeliverablesChecklist projectId={projectState.id} compact />
                    </div>
                  ) : null}
                  {FEATURES.projectReferences ? (
                    <div className="border-t border-border bg-bg-secondary p-4 sm:p-5">
                      <ProjectReferencesSection
                        projectId={projectState.id}
                        projectName={projectState.name}
                        clientName={projectState.client_name}
                        compact
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section aria-label="Photo gallery">
          {photos.length > 0 && (
            <p className="mb-4 text-[11px] text-text-muted leading-relaxed max-w-3xl">
              <span className="md:hidden">
                Tap to preview · long-press to select for delete.
              </span>
              <span className="hidden md:inline">
                Click to select · drag to box-select · Ctrl+click or long-press
                for multi-select · Esc to clear.
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
              onCloseManagePreview={manageActivation.closePreview}
              onDeletePhotos={() => setDeleteDialogOpen(true)}
            />
          </div>

          <p className="mt-6 text-[12px] text-text-muted leading-relaxed">
            {photos.length === 0
              ? "Drag photos anywhere on this page, or use Upload photos. Then share the gallery link with your client."
              : "Your client selects favorites from the gallery link."}
          </p>
        </section>
      </DashboardMain>
    </>
  );
}
