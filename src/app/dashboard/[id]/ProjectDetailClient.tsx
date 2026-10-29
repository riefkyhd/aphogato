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
import { SegmentedControl } from "@/components/ui/SegmentedControl";
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

type ProjectWorkspaceTab = "photos" | "brief" | "settings";

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
  const [activeTab, setActiveTab] = useState<ProjectWorkspaceTab>("photos");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

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

  const photoIdsForStage = useMemo(
    () => displayedPhotos.map((p) => p.id),
    [displayedPhotos]
  );

  const manage = usePhotoManageSelection(photoIdsForStage);
  const manageActivation = useManagePhotoActivation(manage);

  const clientSelectedIds = useMemo(() => {
    const s = new Set<string>();
    for (const p of displayedPhotos) {
      if (p.is_selected) s.add(p.id);
    }
    return s;
  }, [displayedPhotos]);

  const clientSelectedCount = clientSelectedIds.size;
  const maxSelection = normalizeMaxPhotoSelection(
    projectState.max_photo_selection
  );
  const clientOverLimit = isOverSelectionLimit(
    clientSelectedCount,
    maxSelection
  );

  const photosToDelete = useMemo(() => {
    const set = manage.manageSelected;
    return displayedPhotos.filter((p) => set.has(p.id));
  }, [displayedPhotos, manage.manageSelected]);

  const clientPicksInDelete = useMemo(() => {
    const set = manage.manageSelected;
    return displayedPhotos.filter((p) => set.has(p.id) && p.is_selected);
  }, [displayedPhotos, manage.manageSelected]);

  const { isDragging, draggedFileCount } = usePhotoDropZone({
    enabled: !upload.uploading,
    onDropFiles: upload.uploadFiles,
  });

  const confirmDeletePhotos = useCallback(async () => {
    const ids = photosToDelete.map((p) => p.id);
    if (ids.length === 0) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectState.id}/photos/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: ids }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to delete photos");
        return;
      }
      toast.success(
        ids.length === 1 ? "Photo deleted" : `${ids.length} photos deleted`
      );
      setPhotos((prev) => prev.filter((p) => !manage.manageSelected.has(p.id)));
      manage.clear();
      setDeleteDialogOpen(false);
      refreshProjectPhotos();
    } catch {
      toast.error("Failed to delete photos");
    } finally {
      setDeleting(false);
    }
  }, [
    photosToDelete,
    projectState.id,
    manage,
    refreshProjectPhotos,
  ]);

  const confirmDeleteProject = useCallback(async () => {
    const runDelete = async () => {
      setDeletingProject(true);
      try {
        const res = await fetch(`/api/projects/${projectState.id}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(data?.error ?? "Failed to delete project");
          return;
        }
        toast.success("Project deleted");
        setDeleteProjectOpen(false);
        router.push("/dashboard");
        router.refresh();
      } catch {
        toast.error("Failed to delete project");
      } finally {
        setDeletingProject(false);
      }
    };

    if (guardSensitiveAction) {
      guardSensitiveAction(() => void runDelete());
    } else {
      void runDelete();
    }
  }, [projectState.id, guardSensitiveAction, router]);

  const setCoverFromSelection = useCallback(async () => {
    const selectedIds = Array.from(manage.manageSelected);
    if (selectedIds.length !== 1) {
      toast.error("Select exactly one photo to set as cover");
      return;
    }
    const photoId = selectedIds[0];
    try {
      const res = await fetch(`/api/projects/${projectState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_photo_id: photoId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update cover photo");
        return;
      }
      setProjectState(normalizeProject(json.project as Project));
      toast.success("Cover photo updated");
      manage.clear();
    } catch {
      toast.error("Failed to update cover photo");
    }
  }, [manage, projectState.id]);

  const isCloudinaryProject =
    projectState.storage_provider !== "imagekit" &&
    projectState.storage_provider !== "gdrive";
  const imageKitProject = isImageKitProject(projectState);

  const {
    account: cloudinaryAccount,
    usage: cloudinaryUsage,
    loading: cloudinaryUsageLoading,
  } = useProjectCloudinaryUsage(
    isCloudinaryProject ? projectState.cloudinary_account : null
  );

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
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          All projects
        </BackNavLink>

        <header className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-light tracking-[0.05em] uppercase break-words">
                {projectState.name}
              </h1>
              <p className="mt-1 text-text-secondary text-[14px]">
                {projectState.client_name ?? "—"}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[11px] uppercase tracking-label text-text-muted">
                <StatusDot status={projectState.status as ProjectStatus} />
                <span>
                  {photos.length} photo{photos.length === 1 ? "" : "s"}
                </span>
                <span>
                  {clientSelectedCount} client pick
                  {clientSelectedCount === 1 ? "" : "s"}
                </span>
                {projectState.storage_provider === "gdrive" ? (
                  <span className="text-[10px] text-text-secondary border border-border px-1.5 py-0.5">
                    Google Drive
                  </span>
                ) : imageKitProject ? (
                  <ProjectImageKitBadge />
                ) : FEATURES.cloudinarySettings && !FEATURES.photographerFirstUi ? (
                  <ProjectCloudinaryUsageBadge
                    account={cloudinaryAccount}
                    usage={cloudinaryUsage}
                    loading={cloudinaryUsageLoading}
                  />
                ) : null}
              </div>
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

          <div className="mt-6 border-b border-border pb-4 flex justify-start">
            <SegmentedControl
              value={activeTab}
              aria-label="Project workspaces"
              options={[
                { value: "photos", label: `Photos (${photos.length})` },
                {
                  value: "brief",
                  label: "Brief & Moodboard",
                },
                { value: "settings", label: "Settings & Setup" },
              ]}
              onChange={(val) =>
                setActiveTab(val as ProjectWorkspaceTab)
              }
            />
          </div>
        </header>

        {activeTab === "photos" && (
          <section aria-label="Photo gallery">
            {/* Proofs vs Edited Finals Stage Selector */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="inline-flex w-full sm:w-auto rounded-sm border border-border bg-bg-secondary p-1">
                <button
                  type="button"
                  onClick={() => setCurrentStage("proof")}
                  className={cn(
                    "flex-1 sm:flex-none min-h-[44px] sm:min-h-0 rounded-sm px-3 py-1.5 text-[12px] uppercase tracking-label font-medium transition-colors",
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
                    "flex-1 sm:flex-none min-h-[44px] sm:min-h-0 rounded-sm px-3 py-1.5 text-[12px] uppercase tracking-label font-medium transition-colors",
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
                  className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-0 text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
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
              {isCloudinaryProject &&
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
        )}

        {activeTab === "brief" && (
          <section aria-label="Brief and moodboard" className="space-y-6">
            {FEATURES.deliverables ? (
              <div className="border border-border bg-bg-secondary p-4 sm:p-5">
                <DeliverablesChecklist projectId={projectState.id} />
              </div>
            ) : null}
            {FEATURES.projectReferences ? (
              <div className="border border-border bg-bg-secondary p-4 sm:p-5">
                <ProjectReferencesSection
                  projectId={projectState.id}
                  projectName={projectState.name}
                  clientName={projectState.client_name}
                />
              </div>
            ) : null}
          </section>
        )}

        {activeTab === "settings" && (
          <section aria-label="Project settings" className="space-y-6">
            <div className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-6">
              <div>
                <h3 className="text-[12px] uppercase tracking-label text-text-muted mb-4">
                  Project Details
                </h3>
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
              </div>

              <div className="border-t border-border pt-6">
                <ProjectMaxSelection
                  project={projectState}
                  clientSelectedCount={clientSelectedCount}
                  photoCount={photos.length}
                  clientOverLimit={clientOverLimit}
                  onUpdated={setProjectState}
                />
              </div>

              {FEATURES.faceSearch ? (
                <div className="border-t border-border pt-6">
                  <ProjectFaceSearchSettings
                    project={projectState}
                    photoCount={photos.length}
                    onUpdated={setProjectState}
                  />
                </div>
              ) : null}

              <div className="border-t border-border pt-6">
                <ProjectGDriveSettings
                  project={projectState}
                  onUpdated={setProjectState}
                />
              </div>

              {imageKitProject ? (
                <div className="border-t border-border pt-6">
                  <ProjectImageKitStorageNote photoCount={photos.length} />
                </div>
              ) : FEATURES.cloudinarySettings && !FEATURES.photographerFirstUi ? (
                <div className="border-t border-border pt-6">
                  <ProjectCloudinaryAccountNote
                    account={cloudinaryAccount}
                    usage={cloudinaryUsage}
                    loading={cloudinaryUsageLoading}
                    photoCount={photos.length}
                  />
                </div>
              ) : null}

              <div className="border-t border-border pt-6 flex justify-between items-center">
                <div>
                  <h4 className="text-[13px] text-text-primary">Delete Project</h4>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    Permanently delete this project, client picks, and associated photos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteProjectOpen(true)}
                  className="px-3 py-1.5 text-[11px] uppercase tracking-label text-status-cancelled hover:bg-status-cancelled/10 border border-status-cancelled/30 transition-colors"
                >
                  Delete project
                </button>
              </div>
            </div>
          </section>
        )}
      </DashboardMain>
    </>
  );
}
