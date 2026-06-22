"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { RefreshCw } from "lucide-react";
import {
  GALLERY_ERROR_CODES,
  GALLERY_MESSAGES,
  selectionLimitMessage,
  staleSelectionMessage,
} from "@/lib/galleryErrors";
import { normalizeProject } from "@/lib/normalizeProject";
import {
  formatSelectionCount,
  isOverSelectionLimit,
  normalizeMaxPhotoSelection,
  selectionAtLimitMessage,
} from "@/lib/photoSelectionLimit";
import {
  findStaleSelectionIds,
  pruneSelectionToPhotos,
} from "@/lib/gallerySelection";
import { gallerySelectionStorageKey } from "@/lib/galleryStorage";
import { GalleryClientHint } from "@/components/gallery/GalleryClientHint";
import { FaceFindControls } from "@/components/gallery/FaceFindControls";
import { FaceSearchPrivacyBanner } from "@/components/gallery/FaceSearchPrivacyBanner";
import {
  GalleryScopeFilter,
  type GalleryScope,
} from "@/components/gallery/GalleryScopeFilter";
import { FEATURES } from "@/lib/features";
import type { FaceSearchStatus } from "@/lib/faces/types";
import { GalleryPhotosLoading } from "@/components/GalleryPhotosLoading";
import { PhotoGallerySection } from "@/components/PhotoGallerySection";
import {
  DashboardShell,
  dashboardShellClass,
} from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Photo, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const FacePickModal = FEATURES.faceSearch
  ? dynamic(
      () =>
        import("@/components/gallery/FacePickModal").then((m) => ({
          default: m.FacePickModal,
        })),
      { ssr: false }
    )
  : null;

type GalleryApiResponse = {
  project: Project;
  photos: Photo[];
  confirmedSelectedIds: string[];
  faceSearch: FaceSearchStatus;
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
  initialFaceSearch,
}: {
  token: string;
  initialProject: Project;
  initialPhotos: Photo[];
  previouslyConfirmed: boolean;
  initialConfirmedSelectedIds: string[];
  initialFaceSearch: FaceSearchStatus;
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
  const [galleryScope, setGalleryScope] = useState<GalleryScope>("all");
  const [faceSearch, setFaceSearch] = useState(initialFaceSearch);
  const [facePickMode, setFacePickMode] = useState(false);
  const [facePickPhoto, setFacePickPhoto] = useState<Photo | null>(null);
  const [faceFilterIds, setFaceFilterIds] = useState<Set<string> | null>(null);
  const [faceMatchCount, setFaceMatchCount] = useState<number | null>(null);
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
      setProject(normalizeProject(data.project));
      setPhotos(data.photos);
      setFaceSearch(data.faceSearch);

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

  useLayoutEffect(() => {
    applyGalleryData(
      {
        project: initialProject,
        photos: initialPhotos,
        confirmedSelectedIds: initialConfirmedSelectedIds,
        faceSearch: initialFaceSearch,
      },
      { persistSelectionToStorage: true }
    );
    if (initialPhotos.length === 0) {
      setSyncNotice(GALLERY_MESSAGES.galleryEmpty);
    }
    setReady(true);
  }, [
    token,
    applyGalleryData,
    initialProject,
    initialPhotos,
    initialConfirmedSelectedIds,
    initialFaceSearch,
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

  const maxSelection = normalizeMaxPhotoSelection(project.max_photo_selection);
  const selectedCount = selected.size;
  const overSelectionLimit = isOverSelectionLimit(selectedCount, maxSelection);
  const selectionLimitReached = selectedCount >= maxSelection;

  useEffect(() => {
    if (
      !FEATURES.faceSearch ||
      !faceSearch.enabled ||
      faceSearch.status !== "ready"
    ) {
      return;
    }
    void import("@/lib/faces/faceIndexClient").then((m) =>
      m.preloadFaceIndexWorker()
    );
  }, [faceSearch.enabled, faceSearch.status]);

  const faceSearchReady =
    FEATURES.faceSearch &&
    faceSearch.enabled &&
    faceSearch.status === "ready";

  const scopedPhotos = useMemo(() => {
    let rows = photos;
    if (faceFilterIds) {
      rows = rows.filter((photo) => faceFilterIds.has(photo.id));
    }
    if (galleryScope === "selected") {
      rows = rows.filter((photo) => selected.has(photo.id));
    }
    return rows;
  }, [photos, galleryScope, selected, faceFilterIds]);

  useEffect(() => {
    if (galleryScope === "selected" && selectedCount === 0) {
      setGalleryScope("all");
    }
  }, [galleryScope, selectedCount]);

  function toggle(id: string) {
    if (!photos.some((p) => p.id === id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setError(null);
        return next;
      }
      if (prev.size >= maxSelection) {
        setError(selectionAtLimitMessage(maxSelection));
        return prev;
      }
      next.add(id);
      setError(null);
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
    if (overSelectionLimit) {
      setError(selectionLimitMessage(selectedCount, maxSelection));
      return;
    }
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
        if (
          res.status === 400 &&
          json.code === GALLERY_ERROR_CODES.SELECTION_LIMIT
        ) {
          setError(
            json.error ?? selectionLimitMessage(selectedCount, maxSelection)
          );
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
        setProject(normalizeProject(json.project));
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
  const isUpdateFlow =
    project.status !== "pending" || previouslyConfirmed;

  const topNotice = saveNotice ?? syncNotice;

  const refreshButton = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      loading={syncing}
      disabled={syncing || !ready}
      className="shrink-0 whitespace-nowrap"
      onClick={syncGallery}
    >
      {!syncing && <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {syncing ? "Refreshing…" : "Refresh gallery"}
    </Button>
  );

  return (
    <main className="min-h-screen bg-bg-primary pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {topNotice && (
        <div
          className="fixed top-4 left-4 right-4 z-40 flex justify-center pointer-events-none sm:top-5"
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

      <DashboardShell className="pt-[max(1.5rem,env(safe-area-inset-top))] pb-3 sm:pt-10 sm:pb-4">
        <header>
          <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl leading-tight sm:text-2xl md:text-3xl font-light tracking-[0.05em] uppercase break-words">
                {project.name}
              </h1>
              {project.client_name ? (
                <p className="mt-2 text-text-secondary text-[14px] sm:text-[15px] leading-relaxed">
                  Hi {project.client_name}, select up to {maxSelection} photo
                  {maxSelection === 1 ? "" : "s"} you&rsquo;d like edited.
                </p>
              ) : (
                <p className="mt-2 text-text-secondary text-[14px] sm:text-[15px] leading-relaxed">
                  Select up to {maxSelection} photo
                  {maxSelection === 1 ? "" : "s"} for editing.
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-label text-text-muted">
                {ready ? (
                  <span>
                    {total} photo{total === 1 ? "" : "s"}
                  </span>
                ) : (
                  <Skeleton className="h-3 w-24 rounded-sm" />
                )}
                {ready && selectedCount > 0 && (
                  <span>
                    {selectedCount} selected
                  </span>
                )}
              </div>
            </div>

            <div className="hidden lg:block shrink-0">{refreshButton}</div>
          </div>
        </header>
      </DashboardShell>

      {error && (
        <DashboardShell className="mb-4">
          <div
            className="rounded-sm border border-status-editing/40 bg-bg-elevated px-4 py-3"
            role="alert"
          >
            <p className="text-[13px] text-text-primary leading-relaxed">
              {error}
            </p>
          </div>
        </DashboardShell>
      )}

      <DashboardShell>
        <section aria-label="Photo gallery">
          {!ready ? (
            <GalleryPhotosLoading />
          ) : photos.length === 0 ? (
            <p className="text-text-secondary text-[14px] leading-relaxed">
              {GALLERY_MESSAGES.galleryEmpty}
            </p>
          ) : (
            <>
              <GalleryClientHint token={token} className="mb-3 sm:mb-4" />
              {faceSearchReady ? (
                <div className="mb-3 sm:mb-4">
                  <FaceSearchPrivacyBanner />
                </div>
              ) : null}
              <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                {FEATURES.clientPhotoSelection ? (
                  <GalleryScopeFilter
                    value={galleryScope}
                    selectedCount={selectedCount}
                    disabled={!ready}
                    onChange={setGalleryScope}
                  />
                ) : (
                  <div />
                )}
                {FEATURES.faceSearch ? (
                <FaceFindControls
                  active={faceSearchReady}
                  facePickMode={facePickMode}
                  matchCount={faceMatchCount}
                  matching={facePickPhoto !== null}
                  disabled={!ready || syncing}
                  onStartPick={() => {
                    setFacePickMode(true);
                    setError(null);
                  }}
                  onClearFilter={() => {
                    setFaceFilterIds(null);
                    setFaceMatchCount(null);
                    setFacePickMode(false);
                  }}
                  onCancelPick={() => setFacePickMode(false)}
                />
                ) : null}
              </div>
              {FEATURES.faceSearch &&
              faceSearch.enabled &&
              faceSearch.status === "partial" ? (
                <p className="mb-3 text-[12px] text-status-editing leading-relaxed">
                  Fitur cari foto belum siap sepenuhnya — hasil mungkin terbatas
                  sampai sebagian besar foto terindeks.
                </p>
              ) : null}
              {galleryScope === "selected" && scopedPhotos.length === 0 ? (
                <p className="text-text-secondary text-[14px] leading-relaxed">
                  Belum ada foto terpilih. Buka tab Semua, lalu ketuk foto yang
                  ingin dipilih.
                </p>
              ) : faceFilterIds && scopedPhotos.length === 0 ? (
                <p className="text-text-secondary text-[14px] leading-relaxed">
                  Tidak ada foto yang cocok dengan wajah ini. Coba foto lain atau
                  hapus filter.
                </p>
              ) : (
                <PhotoGallerySection
                  photos={scopedPhotos}
                  mode="gallery"
                  viewStorageId={token}
                  selectedIds={selected}
                  onToggleSelect={toggle}
                  selectionLimitReached={selectionLimitReached}
                  facePickMode={FEATURES.faceSearch && facePickMode}
                  onFacePickPhoto={
                    FEATURES.faceSearch
                      ? (photo) => setFacePickPhoto(photo)
                      : undefined
                  }
                />
              )}
            </>
          )}
        </section>
      </DashboardShell>

      {FEATURES.faceSearch && FacePickModal ? (
      <FacePickModal
        open={facePickPhoto !== null}
        photo={facePickPhoto}
        token={token}
        onClose={() => {
          setFacePickPhoto(null);
          setFacePickMode(false);
        }}
        onMatched={(photoIds, matchCount) => {
          setFaceFilterIds(new Set(photoIds));
          setFaceMatchCount(matchCount);
          setFacePickMode(false);
          setGalleryScope("all");
          if (matchCount === 0) {
            setError("Tidak ada foto serupa ditemukan. Coba foto lain.");
          } else {
            setSyncNotice(`${matchCount} foto dengan wajah ini`);
          }
        }}
      />
      ) : null}

      {FEATURES.clientPhotoSelection ? (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-secondary/95 backdrop-blur-md">
        <div
          className={cn(
            dashboardShellClass,
            "flex flex-col gap-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:min-h-16 sm:flex-row sm:items-center sm:justify-between"
          )}
        >
          <span
            className={cn(
              "text-center text-[11px] uppercase tracking-label sm:text-left",
              overSelectionLimit
                ? "text-status-editing"
                : "text-text-primary"
            )}
          >
            {formatSelectionCount(selectedCount, maxSelection)}
            {overSelectionLimit ? (
              <span className="block sm:inline sm:before:content-['·'] sm:before:mx-1">
                deselect extras to save
              </span>
            ) : null}
          </span>
          <div className="grid w-full grid-cols-[auto_1fr] gap-2 sm:flex sm:w-auto sm:items-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="lg:hidden !w-9 !min-w-9 !px-0 sm:!w-auto sm:!min-w-0 sm:!px-3 whitespace-nowrap"
              loading={syncing}
              disabled={syncing || !ready}
              onClick={syncGallery}
              aria-label={syncing ? "Refreshing gallery" : "Refresh gallery"}
            >
              {!syncing && (
                <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              <span className="hidden sm:inline">
                {syncing ? "Refreshing…" : "Refresh"}
              </span>
            </Button>
            <Button
              type="button"
              size="sm"
              className="min-w-0"
              loading={submitting}
              onClick={submitSelection}
              disabled={
                submitting ||
                syncing ||
                !ready ||
                selectedCount === 0 ||
                total === 0 ||
                overSelectionLimit
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
      </div>
      ) : null}
    </main>
  );
}
