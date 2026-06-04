"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import {
  GALLERY_ERROR_CODES,
  GALLERY_MESSAGES,
  staleSelectionMessage,
} from "@/lib/galleryErrors";
import {
  findStaleSelectionIds,
  pruneSelectionToPhotos,
} from "@/lib/gallerySelection";
import { gallerySelectionStorageKey } from "@/lib/galleryStorage";
import { PhotoGallerySection } from "@/components/PhotoGallerySection";
import { Button } from "@/components/ui/Button";
import type { Photo, Project } from "@/lib/types";

type GalleryApiResponse = {
  project: Project;
  photos: Photo[];
  confirmedSelectedIds: string[];
};

type ConfirmErrorResponse = {
  error?: string;
  code?: string;
  missingIds?: string[];
  missingCount?: number;
};

function mergeSelectionIds(
  photos: Photo[],
  projectStatus: Project["status"],
  storageKey: string,
  token: string,
  confirmedFromDb: string[],
  preferred?: Set<string>
): Set<string> {
  const validIds = new Set(photos.map((p) => p.id));

  if (preferred) {
    return new Set(Array.from(preferred).filter((id) => validIds.has(id)));
  }

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

async function fetchGallery(
  token: string
): Promise<
  | { ok: true; data: GalleryApiResponse }
  | { ok: false; status: number; error: string; code?: string }
> {
  try {
    const res = await fetch(`/api/gallery/${token}`, {
      method: "GET",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    const data = (await res.json()) as GalleryApiResponse & {
      error?: string;
      code?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data.error ?? GALLERY_MESSAGES.loadFailed,
        code: data.code,
      };
    }
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      status: 0,
      error: GALLERY_MESSAGES.network,
      code: GALLERY_ERROR_CODES.NETWORK,
    };
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
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const applyGalleryData = useCallback(
    (
      data: GalleryApiResponse,
      options: {
        persistSelectionToStorage: boolean;
        previousSelected?: Set<string>;
      }
    ) => {
      setProject(data.project);
      setPhotos(data.photos);

      const prunedCount = options.previousSelected
        ? findStaleSelectionIds(data.photos, options.previousSelected).length
        : 0;

      const nextSelected = mergeSelectionIds(
        data.photos,
        data.project.status,
        storageKey,
        token,
        data.confirmedSelectedIds,
        options.previousSelected
          ? pruneSelectionToPhotos(data.photos, options.previousSelected)
          : undefined
      );
      setSelected(nextSelected);

      if (options.persistSelectionToStorage) {
        try {
          window.localStorage.setItem(
            storageKey,
            JSON.stringify(Array.from(nextSelected))
          );
        } catch {
          // ignore
        }
      }

      return { prunedCount };
    },
    [storageKey, token]
  );

  const refreshGallery = useCallback(
    async (options?: { showSyncSuccess?: boolean }) => {
      const previousSelected = new Set(selectedRef.current);
      const result = await fetchGallery(token);

      if (!result.ok) {
        if (result.status === 404) {
          setError(GALLERY_MESSAGES.galleryNotFound);
        } else {
          setError(result.error);
        }
        return { success: false as const };
      }

      const { prunedCount } = applyGalleryData(result.data, {
        persistSelectionToStorage: true,
        previousSelected,
      });

      setError(null);

      if (prunedCount > 0) {
        setSyncNotice(GALLERY_MESSAGES.syncPruned(prunedCount));
      } else if (options?.showSyncSuccess) {
        setSyncNotice(GALLERY_MESSAGES.syncSuccess);
      }

      if (result.data.photos.length === 0) {
        setSyncNotice(GALLERY_MESSAGES.galleryEmpty);
      }

      return { success: true as const, data: result.data, prunedCount };
    },
    [token, applyGalleryData]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadFreshGallery() {
      const result = await fetchGallery(token);
      if (cancelled) return;

      if (!result.ok) {
        setError(
          result.status === 404
            ? GALLERY_MESSAGES.galleryNotFound
            : result.error
        );
        applyGalleryData(
          {
            project: initialProject,
            photos: initialPhotos,
            confirmedSelectedIds: initialConfirmedSelectedIds,
          },
          { persistSelectionToStorage: true }
        );
        setReady(true);
        return;
      }

      applyGalleryData(result.data, { persistSelectionToStorage: true });
      if (result.data.photos.length === 0) {
        setSyncNotice(GALLERY_MESSAGES.galleryEmpty);
      }
      setReady(true);
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

  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);

  useEffect(() => {
    if (!syncNotice) return;
    const timer = window.setTimeout(() => setSyncNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [syncNotice]);

  const selectedCount = selected.size;

  function toggle(id: string) {
    if (!photos.some((p) => p.id === id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function syncGallery() {
    setSyncing(true);
    setError(null);
    try {
      await refreshGallery({ showSyncSuccess: true });
    } finally {
      setSyncing(false);
    }
  }

  async function submitSelection() {
    if (selectedCount === 0) return;
    setError(null);
    setSubmitting(true);
    const wasUpdate = previouslyConfirmed || project.status !== "pending";

    try {
      const staleLocal = findStaleSelectionIds(photos, selected);
      if (staleLocal.length > 0) {
        await refreshGallery();
        setError(staleSelectionMessage(staleLocal.length));
        return;
      }

      const res = await fetch("/api/gallery/confirm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: project.gallery_token,
          selectedIds: Array.from(selected),
        }),
      });

      const json = (await res.json().catch(() => ({}))) as ConfirmErrorResponse & {
        project?: Project;
      };

      if (!res.ok) {
        if (
          res.status === 409 &&
          json.code === GALLERY_ERROR_CODES.STALE_SELECTION
        ) {
          await refreshGallery();
          setError(
            json.error ?? staleSelectionMessage(json.missingCount ?? 1)
          );
          return;
        }
        if (res.status === 404) {
          setError(GALLERY_MESSAGES.galleryNotFound);
          return;
        }
        setError(json.error ?? GALLERY_MESSAGES.saveFailed);
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

      setSaveNotice(
        wasUpdate
          ? "Your selection has been updated."
          : "Your selections have been saved."
      );

      if (json.project) {
        setProject(json.project);
      }

      const refresh = await fetchGallery(token);
      if (refresh.ok) {
        applyGalleryData(refresh.data, { persistSelectionToStorage: true });
      } else {
        setPhotos((prev) =>
          prev.map((ph) => ({
            ...ph,
            is_selected: selected.has(ph.id),
          }))
        );
      }
    } catch {
      setError(GALLERY_MESSAGES.network);
    } finally {
      setSubmitting(false);
    }
  }

  const total = photos.length;
  const headerLabel = useMemo(
    () => `${total} photo${total === 1 ? "" : "s"}`,
    [total]
  );

  const isUpdateFlow =
    project.status !== "pending" || previouslyConfirmed;

  const topNotice = saveNotice ?? syncNotice;

  return (
    <main className="min-h-screen bg-bg-primary pb-[80px]">
      {topNotice && (
        <div
          className="fixed top-4 left-4 right-4 z-40 flex justify-center pointer-events-none sm:top-5 sm:left-6 sm:right-6"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto w-full max-w-lg rounded-md border border-border bg-bg-elevated/95 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <p className="text-[14px] text-text-primary leading-relaxed text-center">
              {topNotice}
            </p>
          </div>
        </div>
      )}

      <header className="px-4 md:px-8 pt-10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.05em] uppercase">
              {project.name}
            </h1>
            {project.client_name && (
              <p className="mt-3 text-text-secondary text-[14px] leading-relaxed">
                Hi {project.client_name}, select the photos you&rsquo;d like
                edited.
              </p>
            )}
            <p className="mt-4 text-[11px] uppercase tracking-label text-text-muted">
              {ready ? headerLabel.toUpperCase() : "Loading…"}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={syncing || !ready}
            className="inline-flex items-center gap-2 shrink-0"
            onClick={syncGallery}
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            )}
            {syncing ? "Refreshing…" : "Refresh gallery"}
          </Button>
        </div>
      </header>

      {error && (
        <div
          className="mx-4 md:mx-8 mb-4 border border-status-editing/40 bg-bg-elevated px-4 py-3"
          role="alert"
        >
          <p className="text-[13px] text-text-primary leading-relaxed">
            {error}
          </p>
        </div>
      )}

      {ready && photos.length === 0 ? (
        <p className="px-4 md:px-8 text-text-secondary text-[14px] leading-relaxed">
          {GALLERY_MESSAGES.galleryEmpty}
        </p>
      ) : (
        <PhotoGallerySection
          photos={photos}
          mode="gallery"
          viewStorageId={token}
          selectedIds={selected}
          onToggleSelect={toggle}
          ready={ready}
        />
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-50 min-h-16 border-t border-border flex flex-wrap items-center justify-between gap-3 px-4 md:px-8 py-3"
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
          <Button
            type="button"
            variant="secondary"
            className="!text-[11px] lg:hidden"
            disabled={syncing || !ready}
            onClick={syncGallery}
          >
            Refresh
          </Button>
          <Button
            type="button"
            onClick={submitSelection}
            disabled={
              submitting || syncing || !ready || selectedCount === 0 || total === 0
            }
          >
            {submitting
              ? "Saving…"
              : isUpdateFlow
                ? "Update selection"
                : "Confirm selection"}
          </Button>
        </div>
      </div>
    </main>
  );
}
