"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { gallerySelectionStorageKey } from "@/lib/galleryStorage";
import { PhotoGallerySection } from "@/components/PhotoGallerySection";
import { Button } from "@/components/ui/Button";
import type { Photo, Project } from "@/lib/types";

type GalleryApiResponse = {
  project: Project;
  photos: Photo[];
  confirmedSelectedIds: string[];
};

function mergeSelectionIds(
  photos: Photo[],
  projectStatus: Project["status"],
  storageKey: string,
  token: string,
  confirmedFromDb: string[]
): Set<string> {
  const validIds = new Set(photos.map((p) => p.id));

  if (projectStatus !== "pending") {
    return new Set(confirmedFromDb.filter((id) => validIds.has(id)));
  }

  try {
    const raw =
      window.localStorage.getItem(storageKey) ??
      window.localStorage.getItem(token);
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids)) return new Set();
    return new Set(
      ids.filter((id): id is string => typeof id === "string" && validIds.has(id))
    );
  } catch {
    return new Set();
  }
}

export function GallerySelector({
  token,
  initialProject,
  initialPhotos,
  previouslyConfirmed,
  initialConfirmedSelectedIds,
}: {
  token: string;
  initialProject: Project;
  initialPhotos: Photo[];
  previouslyConfirmed: boolean;
  initialConfirmedSelectedIds: string[];
}) {
  const storageKey = gallerySelectionStorageKey(token);

  const [project, setProject] = useState(initialProject);
  const [photos, setPhotos] = useState(initialPhotos);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [successWasUpdate, setSuccessWasUpdate] = useState(false);

  const applyGalleryData = useCallback(
    (data: GalleryApiResponse, persistSelectionToStorage: boolean) => {
      setProject(data.project);
      setPhotos(data.photos);

      const nextSelected = mergeSelectionIds(
        data.photos,
        data.project.status,
        storageKey,
        token,
        data.confirmedSelectedIds
      );
      setSelected(nextSelected);

      if (persistSelectionToStorage) {
        try {
          window.localStorage.setItem(
            storageKey,
            JSON.stringify(Array.from(nextSelected))
          );
        } catch {
          // ignore
        }
      }
    },
    [storageKey, token]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadFreshGallery() {
      try {
        const res = await fetch(`/api/gallery/${token}`, {
          method: "GET",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const data = (await res.json()) as GalleryApiResponse & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to load gallery");
          applyGalleryData(
            {
              project: initialProject,
              photos: initialPhotos,
              confirmedSelectedIds: initialConfirmedSelectedIds,
            },
            true
          );
          setReady(true);
          return;
        }
        applyGalleryData(data, true);
      } catch {
        if (cancelled) return;
        applyGalleryData(
          {
            project: initialProject,
            photos: initialPhotos,
            confirmedSelectedIds: initialConfirmedSelectedIds,
          },
          true
        );
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    loadFreshGallery();
    return () => {
      cancelled = true;
    };
  }, [
    token,
    applyGalleryData,
    initialProject,
    initialPhotos,
    initialConfirmedSelectedIds,
  ]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(Array.from(selected))
      );
    } catch {
      // ignore quota errors
    }
  }, [selected, ready, storageKey]);

  const selectedCount = selected.size;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submitSelection() {
    if (selectedCount === 0) return;
    setError(null);
    setSubmitting(true);
    const wasUpdate = previouslyConfirmed || project.status !== "pending";
    try {
      const res = await fetch("/api/gallery/confirm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: project.gallery_token,
          selectedIds: Array.from(selected),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Failed to save selection");
        return;
      }
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(Array.from(selected))
        );
      } catch {
        // ignore
      }
      setSuccessWasUpdate(wasUpdate);
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  const total = photos.length;
  const headerLabel = useMemo(
    () => `${total} photo${total === 1 ? "" : "s"}`,
    [total]
  );

  if (confirmed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-primary px-6">
        <div className="max-w-[480px] text-center">
          <h1 className="text-4xl font-light tracking-[0.1em] uppercase">
            Thank you
          </h1>
          <p className="mt-6 text-text-secondary text-[14px] leading-relaxed">
            {successWasUpdate
              ? "Your selection has been updated."
              : "Your selections have been saved."}
          </p>
          <p className="mt-2 text-text-muted text-[12px]">
            You can close this page.
          </p>
        </div>
      </main>
    );
  }

  const showUpdateBanner =
    project.status !== "pending" || previouslyConfirmed;

  return (
    <main className="min-h-screen bg-bg-primary pb-[80px]">
      {showUpdateBanner && (
        <div className="border-b border-border bg-bg-secondary/80">
          <p className="px-4 md:px-8 py-3 text-[13px] text-text-secondary leading-relaxed">
            You&rsquo;ve already confirmed your selection. You can update it
            below.
          </p>
        </div>
      )}

      <header className="px-4 md:px-8 pt-10 pb-6">
        <h1 className="text-2xl md:text-3xl font-light tracking-[0.05em] uppercase">
          {project.name}
        </h1>
        {project.client_name && (
          <p className="mt-3 text-text-secondary text-[14px] leading-relaxed">
            Hi {project.client_name}, select the photos you&rsquo;d like edited.
          </p>
        )}
        <p className="mt-4 text-[11px] uppercase tracking-label text-text-muted">
          {ready ? headerLabel.toUpperCase() : "Loading…"}
        </p>
      </header>

      <PhotoGallerySection
        photos={photos}
        mode="gallery"
        viewStorageId={token}
        selectedIds={selected}
        onToggleSelect={toggle}
        ready={ready}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border flex items-center justify-between px-4 md:px-8"
        style={{
          background: "rgba(10,10,10,0.95)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <span className="text-[11px] uppercase tracking-label text-text-primary">
          {selectedCount} photo{selectedCount === 1 ? "" : "s"} selected
        </span>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-[11px] uppercase tracking-label text-status-editing max-w-[40vw] truncate">
              {error}
            </span>
          )}
          <Button
            type="button"
            onClick={submitSelection}
            disabled={submitting || !ready || selectedCount === 0}
          >
            {submitting
              ? "Saving…"
              : showUpdateBanner
                ? "Update selection"
                : "Confirm selection"}
          </Button>
        </div>
      </div>
    </main>
  );
}
