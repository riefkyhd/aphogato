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
import { ProjectImageKitBadge } from "@/components/imagekit/ProjectImageKitBadge";
import { ProjectImageKitStorageNote } from "@/components/imagekit/ProjectImageKitStorageNote";
import { MediaUnavailableBanner } from "@/components/media/MediaUnavailable";
import {
  CLOUDINARY_DISABLED_MESSAGE,
  isCloudinaryAccountDisabled,
} from "@/lib/cloudinary/accountStatus";
import { useProjectCloudinaryUsage } from "@/hooks/useProjectCloudinaryUsage";
import { isImageKitProject } from "@/lib/storage/provider";
import { ProjectMaxSelection } from "./ProjectMaxSelection";
import { ProjectFaceSearchSettings } from "./ProjectFaceSearchSettings";
import { ProjectRename } from "./ProjectRename";
import { ProjectGDriveSettings } from "./ProjectGDriveSettings";
import { normalizeProject } from "@/lib/normalizeProject";
import {
  isOverSelectionLimit,
  normalizeMaxPhotoSelection,
} from "@/lib/photoSelectionLimit";
import { resolveProjectCoverUrl } from "@/lib/projectCover";
import type { Photo, PhotoStage, Project } from "@/lib/types";
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
  const [currentStage, setCurrentStage] = useState<PhotoStage>("proof");
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
    faceSearchActive,
    projectState.storage_provider === "imagekit"
      ? "imagekit"
      : projectState.storage_provider === "gdrive"
        ? "gdrive"
        : "cloudinary"
  );

  const displayedPhotos = useMemo(() => {
    return photos.filter((p) => (p.stage ?? "proof") === currentStage);
  }, [photos, currentStage]);

  const proofsCount = useMemo(
    () => photos.filter((p) => (p.stage ?? "proof") === "proof").length,
    [photos]
  );
  const finalsCount = useMemo(
    () => photos.filter((p) => p.stage === "final").length,
    [photos]
  );

  const photoIds = useMemo(() => displayedPhotos.map((p) => p.id), [displayedPhotos]);
  const manage = usePhotoManageSelection(photoIds);
  const manageActivation = useManagePhotoActivation(manage);

  const handleDropFiles = useCallback(
    (files: FileList) => {
      void upload.uploadFiles(files, currentStage);
    },
    [upload, currentStage]
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

  const imageKitProject = isImageKitProject(projectState);

  const {
    account: cloudinaryAccount,
    usage: cloudinaryUsage,
    loading: cloudinaryUsageLoading,
  } = useProjectCloudinaryUsage(
    imageKitProject ? null : projectState.cloudinary_account
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

  async function setCoverFromSelection() {
    const selectedIds = [...manage.manageSelected];
    if (selectedIds.length !== 1) {
      toast.error("Select exactly one photo to set as cover");
      return;
    }

    const photoId = selectedIds[0]!;
    try {
      const res = await fetch(`/api/projects/${projectState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_photo_id: photoId }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        project?: Project;
      };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to set cover photo");
        return;
      }

      if (json.project) {
        setProjectState(normalizeProject(json.project));
      } else {
        setProjectState((prev) => ({ ...prev, cover_photo_id: photoId }));
      }

      manageActivation.clearAll();
      toast.success(
        "Cover updated — used on project cards and client link previews"
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set cover");
    }
  }

  const coverImageUrl = useMemo(
    () => resolveProjectCoverUrl(projectState, photos),
    [projectState, photos]
  );

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
          href="/dashboard/galleries"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          All galleries
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
                {imageKitProject ? (
                  <ProjectImageKitBadge />
                ) : FEATURES.cloudinarySettings && !FEATURES.photographerFirstUi ? (
                  <ProjectCloudinaryUsageBadge
                    account={cloudinaryAccount}
                    usage={cloudinaryUsage}
                    loading={cloudinaryUsageLoading}
                  />
                ) : null}
              </div>
              {imageKitProject ? (
                <ProjectImageKitStorageNote photoCount={photos.length} />
              ) : FEATURES.cloudinarySettings && !FEATURES.photographerFirstUi ? (
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
              storageProvider={
                projectState.storage_provider === "imagekit"
                  ? "imagekit"
                  : projectState.storage_provider === "gdrive"
                    ? "gdrive"
                    : "cloudinary"
              }
              currentStage={currentStage}
              onPhotosSynced={applyServerPhotos}
              onDeleteProject={() => setDeleteProjectOpen(true)}
              onStatusChange={(status) =>
                setProjectState((prev) => ({ ...prev, status }))
              }
              faceSearchEnabled={faceSearchActive}
              coverImageUrl={coverImageUrl}
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
                  <ProjectGDriveSettings
                    project={projectState}
                    onUpdated={setProjectState}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <section aria-label="Photo gallery">
          {/* Proofs vs Edited Finals Stage Selector */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="inline-flex rounded-sm border border-border bg-bg-secondary p-1">
              <button
                type="button"
                onClick={() => setCurrentStage("proof")}
                className={cn(
                  "rounded-sm px-3 py-1.5 text-[12px] uppercase tracking-label font-medium transition-colors",
                  currentStage === "proof"
                    ? "bg-bg-primary text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                Proofs / Culling ({proofsCount})
              </button>
              <button
                type="button"
                onClick={() => setCurrentStage("final")}
                className={cn(
                  "rounded-sm px-3 py-1.5 text-[12px] uppercase tracking-label font-medium transition-colors",
                  currentStage === "final"
                    ? "bg-bg-primary text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                Edited Finals ({finalsCount})
              </button>
            </div>

            {currentStage === "final" && projectState.gdrive_finals_share_url ? (
              <a
                href={projectState.gdrive_finals_share_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
              >
                Open Finals on Google Drive ↗
              </a>
            ) : null}
          </div>

          {displayedPhotos.length > 0 && (
            <p className="mb-4 text-[11px] text-text-muted leading-relaxed max-w-3xl">
              <span className="md:hidden">
                Tap to preview · long-press to select for delete.
              </span>
              <span className="hidden md:inline">
                Click to select · drag to box-select · Ctrl+click or long-press
                for multi-select · select one photo and use Set cover for link
                previews · Esc to clear.
              </span>
            </p>
          )}

          <div
            className="select-none"
            onSelectCapture={(e) => {
              if (manage.count > 0) e.preventDefault();
            }}
          >
            {!imageKitProject &&
            !FEATURES.photographerFirstUi &&
            isCloudinaryAccountDisabled(cloudinaryUsage) ? (
              <MediaUnavailableBanner message={CLOUDINARY_DISABLED_MESSAGE} />
            ) : null}
            <PhotoGallerySection
              photos={displayedPhotos}
              mode="dashboard"
              viewStorageId={`${projectState.gallery_token}-${currentStage}`}
              selectedIds={clientSelectedIds}
              manageSelectedIds={manage.manageSelected}
              onManagePhotoActivate={manageActivation.activate}
              onManagePhotoMarquee={manage.setMarqueeHits}
              managePreviewId={manageActivation.previewId}
              onClearManageSelection={manageActivation.clearAll}
              onCloseManagePreview={manageActivation.closePreview}
              onDeletePhotos={() => setDeleteDialogOpen(true)}
              coverPhotoId={projectState.cover_photo_id}
              onSetCover={() => void setCoverFromSelection()}
            />
          </div>

          <p className="mt-6 text-[12px] text-text-muted leading-relaxed">
            {displayedPhotos.length === 0
              ? currentStage === "final"
                ? "Drop edited final JPEGs from Lightroom here, or sync from your Google Drive Finals folder."
                : "Drag photos anywhere on this page, or use Upload photos. Then share the gallery link with your client."
              : currentStage === "final"
                ? "Edited finals are ready for luxury client delivery and full-res download."
                : "Your client selects favorites from the gallery link."}
          </p>
        </section>
      </DashboardMain>
    </>
  );
}
