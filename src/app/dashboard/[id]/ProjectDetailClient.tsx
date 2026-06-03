"use client";

import { useMemo, useState } from "react";
import { StatusDot, type ProjectStatus } from "@/components/StatusDot";
import { PhotoGallerySection } from "@/components/PhotoGallerySection";
import { ProjectActions } from "./ProjectActions";
import type { Photo, Project } from "@/lib/types";

export function ProjectDetailClient({
  project,
  initialPhotos,
}: {
  project: Project;
  initialPhotos: Photo[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);

  const selectedCount = useMemo(
    () => photos.filter((ph) => ph.is_selected).length,
    [photos]
  );

  const selectedFilenames = useMemo(
    () => photos.filter((ph) => ph.is_selected).map((ph) => ph.filename),
    [photos]
  );

  const selectedIds = useMemo(
    () => new Set(photos.filter((ph) => ph.is_selected).map((ph) => ph.id)),
    [photos]
  );

  return (
    <main className="px-6 md:px-10 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.05em] uppercase">
            {project.name}
          </h1>
          <p className="mt-2 text-text-secondary text-[14px]">
            {project.client_name ?? "—"}
          </p>
          <div className="mt-3">
            <StatusDot status={project.status as ProjectStatus} />
          </div>
        </div>
        <ProjectActions
          projectId={project.id}
          galleryToken={project.gallery_token}
          status={project.status as ProjectStatus}
          selectedFilenames={selectedFilenames}
          onPhotosSynced={setPhotos}
        />
      </div>

      <div className="mb-4 text-[11px] uppercase tracking-label text-text-secondary">
        {selectedCount} of {photos.length} photos selected
      </div>

      <PhotoGallerySection
        photos={photos}
        mode="dashboard"
        viewStorageId={project.gallery_token}
        selectedIds={selectedIds}
      />

      {photos.length > 0 && (
        <p className="mt-6 text-[12px] text-text-muted leading-relaxed">
          Photos are selected by the client via the gallery link.
        </p>
      )}
    </main>
  );
}
