"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Settings } from "lucide-react";
import { FEATURES } from "@/lib/features";
import { ProjectRename } from "@/app/dashboard/[id]/ProjectRename";
import { ProjectMaxSelection } from "@/app/dashboard/[id]/ProjectMaxSelection";
import { ProjectFaceSearchSettings } from "@/app/dashboard/[id]/ProjectFaceSearchSettings";
import { ProjectGDriveSettings } from "@/app/dashboard/[id]/ProjectGDriveSettings";
import { ProjectImageKitStorageNote } from "@/components/imagekit/ProjectImageKitStorageNote";
import { ProjectCloudinaryAccountNote } from "@/components/cloudinary/ProjectCloudinaryAccountNote";
import type {
  CloudinaryAccountPublic,
  CloudinaryAccountUsagePublic,
} from "@/lib/cloudinary/types";
import type { Photo, Project } from "@/lib/types";

export function ProjectSettingsAccordion({
  project,
  photos,
  clientSelectedCount,
  clientOverLimit,
  cloudinaryAccount,
  cloudinaryUsage,
  cloudinaryUsageLoading,
  imageKitProject,
  onProjectUpdated,
  onPhotosUpdated,
  onFolderRenamed,
  onRequestDelete,
}: {
  project: Project;
  photos: Photo[];
  clientSelectedCount: number;
  clientOverLimit: boolean;
  cloudinaryAccount: CloudinaryAccountPublic | null;
  cloudinaryUsage: CloudinaryAccountUsagePublic | null;
  cloudinaryUsageLoading: boolean;
  imageKitProject: boolean;
  onProjectUpdated: (next: Project) => void;
  onPhotosUpdated?: (photos: Photo[]) => void;
  onFolderRenamed?: () => void;
  onRequestDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border bg-bg-secondary transition-colors">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-4 sm:px-5 py-4 flex items-center justify-between text-left hover:bg-bg-primary/30 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Settings className="h-4 w-4 text-text-muted shrink-0" aria-hidden />
          <div className="min-w-0">
            <h3 className="text-[12px] uppercase tracking-label font-medium text-text-primary">
              Advanced &amp; Storage Settings
            </h3>
            <p className="text-[11px] text-text-muted truncate mt-0.5">
              Storage backend, selection limits, Google Drive folder, face search, and deletion
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-[11px] text-text-muted hidden sm:inline uppercase tracking-label">
            {open ? "Collapse" : "Expand"}
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-muted" aria-hidden />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-4 sm:px-5 py-6 space-y-6 bg-bg-primary/20">
          <div>
            <h4 className="text-[11px] uppercase tracking-label text-text-muted mb-3">
              Rename &amp; Client Assignment
            </h4>
            <ProjectRename
              project={project}
              onUpdated={(next, options) => {
                onProjectUpdated(next);
                if (options?.photos && onPhotosUpdated) {
                  onPhotosUpdated(options.photos);
                }
                if (options?.folderRenamed && onFolderRenamed) {
                  onFolderRenamed();
                }
              }}
            />
          </div>

          <div className="border-t border-border pt-6">
            <ProjectMaxSelection
              project={project}
              clientSelectedCount={clientSelectedCount}
              photoCount={photos.length}
              clientOverLimit={clientOverLimit}
              onUpdated={onProjectUpdated}
            />
          </div>

          {FEATURES.faceSearch ? (
            <div className="border-t border-border pt-6">
              <ProjectFaceSearchSettings
                project={project}
                photoCount={photos.length}
                onUpdated={onProjectUpdated}
              />
            </div>
          ) : null}

          <div className="border-t border-border pt-6">
            <ProjectGDriveSettings
              project={project}
              onUpdated={onProjectUpdated}
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

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h4 className="text-[13px] text-text-primary">Delete Project</h4>
              <p className="text-[12px] text-text-muted mt-0.5">
                Permanently delete this project, client picks, and associated photos.
              </p>
            </div>
            <button
              type="button"
              onClick={onRequestDelete}
              className="px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 text-[11px] uppercase tracking-label text-status-cancelled hover:bg-status-cancelled/10 border border-status-cancelled/30 transition-colors"
            >
              Delete project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
