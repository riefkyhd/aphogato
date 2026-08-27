"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard, type ProjectCardData } from "@/components/ProjectCard";
import {
  MediaLoadStatusProvider,
  useMediaLoadFailedCount,
} from "@/components/media/MediaLoadStatus";
import { MediaUnavailableBanner } from "@/components/media/MediaUnavailable";
import {
  isCloudinaryAccountDisabled,
  MEDIA_UNAVAILABLE_BANNER_ADMIN,
} from "@/lib/cloudinary/accountStatus";
import type { CloudinaryAccountUsagePublic } from "@/lib/cloudinary/types";
import { FEATURES } from "@/lib/features";
import {
  clearProjectsStatusDirty,
  isProjectsStatusDirty,
} from "@/lib/projects/invalidateProjectsViews";

function ProjectsGridInner({ projects }: { projects: ProjectCardData[] }) {
  const failedCount = useMediaLoadFailedCount();
  const [accountDisabled, setAccountDisabled] = useState(false);

  useEffect(() => {
    if (!FEATURES.cloudinarySettings) return;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/settings/cloudinary");
        if (!res.ok) return;
        const json = (await res.json()) as {
          usage?: CloudinaryAccountUsagePublic[];
        };
        if (cancelled) return;
        const disabled = (json.usage ?? []).some((entry) =>
          isCloudinaryAccountDisabled(entry)
        );
        setAccountDisabled(disabled);
      } catch {
        // Banner still appears from cover load failures.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const showBanner =
    !FEATURES.photographerFirstUi &&
    (accountDisabled || failedCount >= 2);

  return (
    <>
      {showBanner ? (
        <MediaUnavailableBanner
          message={
            accountDisabled
              ? "One or more Cloudinary accounts are disabled or inactive. Project covers and photos cannot load until those accounts are re-enabled in the Cloudinary console."
              : MEDIA_UNAVAILABLE_BANNER_ADMIN
          }
          className="mb-4"
        />
      ) : null}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-[2px]">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </>
  );
}

export function ProjectsGrid({
  projects: initialProjects,
}: {
  projects: ProjectCardData[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    if (!isProjectsStatusDirty()) return;
    clearProjectsStatusDirty();
    router.refresh();
  }, [router]);

  return (
    <MediaLoadStatusProvider>
      <ProjectsGridInner projects={projects} />
    </MediaLoadStatusProvider>
  );
}
