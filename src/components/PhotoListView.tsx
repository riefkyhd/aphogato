"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLongPress } from "@/hooks/useLongPress";
import { cn } from "@/lib/utils";
import { listThumbUrl, previewLargeUrl } from "@/lib/cloudinaryUrls";
import type { ManagePhotoActivateMeta } from "@/lib/managePhotoActivate";
import type { Photo } from "@/lib/types";

function formatIndex(index: number, total: number): string {
  const pad = String(total).length;
  return `${String(index + 1).padStart(pad, "0")} of ${total}`;
}

function ListCheckmark({
  selected,
  interactive,
  onToggle,
}: {
  selected: boolean;
  interactive: boolean;
  onToggle?: () => void;
}) {
  const boxClass = cn(
    "flex h-8 w-8 shrink-0 items-center justify-center border",
    selected
      ? "border-text-primary bg-text-primary"
      : "border-border bg-transparent"
  );

  if (interactive && onToggle) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={boxClass}
        aria-label={selected ? "Deselect photo" : "Select photo"}
        aria-pressed={selected}
      >
        {selected && (
          <Check className="h-4 w-4 text-bg-primary" strokeWidth={2.5} />
        )}
      </button>
    );
  }

  return (
    <div className={boxClass} aria-hidden>
      {selected && (
        <Check className="h-4 w-4 text-bg-primary" strokeWidth={2.5} />
      )}
    </div>
  );
}

function ListPreview({
  photo,
  selected,
  onToggle,
  selectLabel,
  deselectLabel,
}: {
  photo: Photo | null;
  selected?: boolean;
  onToggle?: () => void;
  selectLabel?: string;
  deselectLabel?: string;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [photo?.id]);

  if (!photo) {
    return (
      <div className="flex flex-1 min-h-[280px] lg:min-h-0 items-center justify-center bg-bg-primary p-8">
        <p className="text-[11px] uppercase tracking-label text-text-muted text-center">
          Select a photo to preview
        </p>
      </div>
    );
  }

  const src = previewLargeUrl(photo.cloudinary_url);
  const canToggle = Boolean(onToggle);
  const isSelected = selected ?? false;

  return (
    <div className="flex flex-1 min-h-[280px] lg:min-h-0 flex-col bg-bg-primary">
      <div className="relative flex flex-1 items-center justify-center min-h-[240px] p-4">
        {loading && (
          <Loader2
            className="absolute h-8 w-8 animate-spin text-text-muted"
            aria-hidden
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={photo.filename}
          className={cn(
            "max-h-full max-w-full object-contain transition-opacity",
            loading ? "opacity-0" : "opacity-100",
            isSelected && "ring-2 ring-text-primary ring-offset-2 ring-offset-bg-primary"
          )}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </div>
      <div className="px-4 pb-4 flex flex-col items-center gap-3">
        <p className="w-full text-[11px] uppercase tracking-label text-text-secondary text-center truncate">
          {photo.filename}
        </p>
        {canToggle && (
          <Button
            type="button"
            variant={isSelected ? "secondary" : "primary"}
            className="!text-[11px] !h-9 !px-4 w-full max-w-[280px]"
            onClick={onToggle}
          >
            {isSelected
              ? (deselectLabel ?? "Deselect")
              : (selectLabel ?? "Select")}
          </Button>
        )}
      </div>
    </div>
  );
}

function ListRowButton({
  ph,
  index,
  isPreviewing,
  manageInteractive,
  galleryInteractive,
  onManagePhotoActivate,
  setPreviewId,
  setFocusedIndex,
  rowRefs,
  children,
}: {
  ph: Photo;
  index: number;
  isPreviewing: boolean;
  manageInteractive: boolean;
  galleryInteractive: boolean;
  onManagePhotoActivate?: (id: string, meta: ManagePhotoActivateMeta) => void;
  setPreviewId?: (id: string | null) => void;
  setFocusedIndex: (index: number) => void;
  rowRefs: React.MutableRefObject<Map<number, HTMLButtonElement>>;
  children: React.ReactNode;
}) {
  const { longPressHandlers } = useLongPress(() => {
    onManagePhotoActivate?.(ph.id, {
      ctrlKey: false,
      metaKey: false,
      longPress: true,
    });
  });

  return (
    <button
      type="button"
      ref={(el) => {
        if (el) rowRefs.current.set(index, el);
        else rowRefs.current.delete(index);
      }}
      onClick={(e) => {
        setFocusedIndex(index);
        if (manageInteractive && onManagePhotoActivate) {
          onManagePhotoActivate(ph.id, {
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
          });
          return;
        }
        if (galleryInteractive) {
          if (isPreviewing) {
            setPreviewId?.(null);
            return;
          }
          setPreviewId?.(ph.id);
        }
      }}
      className="flex min-w-0 flex-1 items-center gap-3 text-left"
      aria-label={
        isPreviewing
          ? `Collapse preview of ${ph.filename}`
          : manageInteractive
            ? `Preview ${ph.filename}`
            : `Preview ${ph.filename}`
      }
      {...(manageInteractive ? longPressHandlers : {})}
    >
      {children}
    </button>
  );
}

function SelectedGroupDivider({ count }: { count: number }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 border-b border-border bg-bg-primary"
      aria-hidden
    >
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 text-[10px] uppercase tracking-label text-text-muted">
        ─── Selected ({count}) ───
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function PhotoListView({
  photos,
  mode,
  selectedIds,
  onToggleSelect,
  manageSelectedIds,
  onManagePhotoActivate,
  managePreviewId = null,
  showSelectedDivider = false,
  selectedGroupCount = 0,
}: {
  photos: Photo[];
  mode: "gallery" | "dashboard";
  selectedIds: Set<string>;
  onToggleSelect?: (id: string) => void;
  manageSelectedIds?: Set<string>;
  onManagePhotoActivate?: (id: string, meta: ManagePhotoActivateMeta) => void;
  managePreviewId?: string | null;
  showSelectedDivider?: boolean;
  selectedGroupCount?: number;
}) {
  const galleryInteractive = mode === "gallery" && Boolean(onToggleSelect);
  const manageInteractive =
    mode === "dashboard" &&
    Boolean(onManagePhotoActivate && manageSelectedIds);
  const interactive = galleryInteractive || manageInteractive;
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [galleryPreviewId, setGalleryPreviewId] = useState<string | null>(null);
  const previewId = manageInteractive ? managePreviewId : galleryPreviewId;
  const setPreviewId = manageInteractive ? undefined : setGalleryPreviewId;
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const previewPhoto = previewId
    ? photos.find((p) => p.id === previewId) ?? null
    : null;

  const previewSelected = previewPhoto
    ? manageInteractive
      ? manageSelectedIds?.has(previewPhoto.id) ?? false
      : galleryInteractive
        ? selectedIds.has(previewPhoto.id)
        : false
    : false;

  const previewToggle =
    galleryInteractive && previewPhoto && onToggleSelect
      ? () => onToggleSelect(previewPhoto.id)
      : undefined;

  const selectLabel = "Select photo";
  const deselectLabel = "Deselect photo";

  const scrollRowIntoView = useCallback((index: number) => {
    const el = rowRefs.current.get(index);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (photos.length === 0) {
      if (!manageInteractive) {
        setGalleryPreviewId(null);
      }
      setFocusedIndex(0);
      return;
    }
    if (focusedIndex >= photos.length) {
      setFocusedIndex(photos.length - 1);
      return;
    }
    if (!previewId) return;

    const idx = photos.findIndex((p) => p.id === previewId);
    if (idx >= 0) {
      if (idx !== focusedIndex) {
        setFocusedIndex(idx);
      }
      return;
    }
    if (setPreviewId) {
      setPreviewId(photos[focusedIndex]?.id ?? photos[0].id);
    }
  }, [photos, focusedIndex, previewId, setPreviewId, manageInteractive]);

  useEffect(() => {
    scrollRowIntoView(focusedIndex);
  }, [focusedIndex, scrollRowIntoView, photos]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (photos.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = Math.min(i + 1, photos.length - 1);
          const ph = photos[next];
          if (manageInteractive && onManagePhotoActivate && ph) {
            onManagePhotoActivate(ph.id, {
              ctrlKey: false,
              metaKey: false,
              forceNavigate: true,
            });
          } else if (setPreviewId && ph) {
            setPreviewId(ph.id);
          }
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = Math.max(i - 1, 0);
          const ph = photos[next];
          if (manageInteractive && onManagePhotoActivate && ph) {
            onManagePhotoActivate(ph.id, {
              ctrlKey: false,
              metaKey: false,
              forceNavigate: true,
            });
          } else if (setPreviewId && ph) {
            setPreviewId(ph.id);
          }
          return next;
        });
      } else if (e.key === " " && interactive) {
        e.preventDefault();
        const ph = photos[focusedIndex];
        if (!ph) return;
        if (manageInteractive && onManagePhotoActivate) {
          onManagePhotoActivate(ph.id, {
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
          });
        } else if (galleryInteractive && onToggleSelect) {
          onToggleSelect(ph.id);
        }
      }
    },
    [
      photos,
      focusedIndex,
      interactive,
      manageInteractive,
      galleryInteractive,
      onManagePhotoActivate,
      onToggleSelect,
      setPreviewId,
    ]
  );

  if (photos.length === 0) {
    return (
      <p className="px-4 md:px-8 text-text-muted text-[13px]">No photos.</p>
    );
  }

  return (
    <div
      className="flex flex-col lg:flex-row lg:min-h-[min(70vh,720px)] border-t border-border"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={listRef}
        className="w-full lg:w-[40%] lg:max-h-[min(70vh,720px)] overflow-y-auto bg-bg-primary lg:border-r border-border"
      >
        {photos.map((ph, index) => {
          const isPreviewing = previewId === ph.id;
          const isManageSelected = manageSelectedIds?.has(ph.id) ?? false;
          const isGallerySelected =
            mode === "gallery" && selectedIds.has(ph.id);
          const isCheckSelected = manageInteractive
            ? isManageSelected
            : isGallerySelected;

          return (
            <Fragment key={ph.id}>
              <div
                className={cn(
                  "flex h-[72px] items-center gap-3 px-3 border-b border-border",
                  isPreviewing && "bg-bg-elevated",
                  isManageSelected && "bg-bg-elevated/60",
                  isGallerySelected &&
                    !manageInteractive &&
                    "bg-bg-elevated/40"
                )}
              >
                <ListRowButton
                  ph={ph}
                  index={index}
                  isPreviewing={isPreviewing}
                  manageInteractive={manageInteractive}
                  galleryInteractive={galleryInteractive}
                  onManagePhotoActivate={onManagePhotoActivate}
                  setPreviewId={setPreviewId}
                  setFocusedIndex={setFocusedIndex}
                  rowRefs={rowRefs}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={listThumbUrl(ph.cloudinary_url)}
                    alt=""
                    width={60}
                    height={60}
                    className="h-[60px] w-[60px] shrink-0 object-cover bg-bg-elevated"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-text-primary">
                      {ph.filename}
                    </p>
                    <p className="text-[12px] text-text-muted">
                      {formatIndex(index, photos.length)}
                      {manageInteractive && ph.is_selected && (
                        <span className="ml-2 text-status-editing">
                          · Client pick
                        </span>
                      )}
                    </p>
                  </div>
                </ListRowButton>
                {galleryInteractive && (
                  <ListCheckmark
                    selected={isCheckSelected}
                    interactive
                    onToggle={
                      onToggleSelect
                        ? () => onToggleSelect(ph.id)
                        : undefined
                    }
                  />
                )}
              </div>
              {isPreviewing && (
                <div className="lg:hidden border-b border-border">
                  <ListPreview
                    photo={ph}
                    selected={isCheckSelected}
                    onToggle={
                      onToggleSelect
                        ? () => onToggleSelect(ph.id)
                        : undefined
                    }
                    selectLabel={selectLabel}
                    deselectLabel={deselectLabel}
                  />
                </div>
              )}
              {showSelectedDivider &&
                selectedGroupCount > 0 &&
                index === selectedGroupCount - 1 && (
                  <SelectedGroupDivider count={selectedGroupCount} />
                )}
            </Fragment>
          );
        })}
      </div>

      <div className="hidden lg:flex w-[60%] flex-col lg:max-h-[min(70vh,720px)]">
        <ListPreview
          photo={previewPhoto}
          selected={previewSelected}
          onToggle={previewToggle}
          selectLabel={selectLabel}
          deselectLabel={deselectLabel}
        />
      </div>
    </div>
  );
}
