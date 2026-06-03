"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listThumbUrl, previewLargeUrl } from "@/lib/cloudinaryUrls";
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

function ListPreview({ photo }: { photo: Photo | null }) {
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
            loading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </div>
      <p className="px-4 pb-4 text-[11px] uppercase tracking-label text-text-secondary text-center truncate">
        {photo.filename}
      </p>
    </div>
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
  showSelectedDivider = false,
  selectedGroupCount = 0,
}: {
  photos: Photo[];
  mode: "gallery" | "dashboard";
  selectedIds: Set<string>;
  onToggleSelect?: (id: string) => void;
  showSelectedDivider?: boolean;
  selectedGroupCount?: number;
}) {
  const interactive = mode === "gallery" && Boolean(onToggleSelect);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const previewPhoto = previewId
    ? photos.find((p) => p.id === previewId) ?? null
    : null;

  const scrollRowIntoView = useCallback((index: number) => {
    const el = rowRefs.current.get(index);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (photos.length === 0) {
      setPreviewId(null);
      setFocusedIndex(0);
      return;
    }
    if (previewId && photos.some((p) => p.id === previewId)) {
      const idx = photos.findIndex((p) => p.id === previewId);
      if (idx >= 0 && idx !== focusedIndex) {
        setFocusedIndex(idx);
      }
      return;
    }
    if (focusedIndex >= photos.length) {
      setFocusedIndex(photos.length - 1);
    }
    if (previewId && !photos.some((p) => p.id === previewId)) {
      setPreviewId(photos[focusedIndex]?.id ?? photos[0].id);
    }
  }, [photos, focusedIndex, previewId]);

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
          setPreviewId(photos[next].id);
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = Math.max(i - 1, 0);
          setPreviewId(photos[next].id);
          return next;
        });
      } else if (e.key === " " && interactive && onToggleSelect) {
        e.preventDefault();
        const ph = photos[focusedIndex];
        if (ph) onToggleSelect(ph.id);
      }
    },
    [photos, focusedIndex, interactive, onToggleSelect]
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
          const isSelected =
            mode === "gallery"
              ? selectedIds.has(ph.id)
              : ph.is_selected;

          return (
            <Fragment key={ph.id}>
              <div
                className={cn(
                  "flex h-[72px] items-center gap-3 px-3 border-b border-border",
                  isPreviewing && "bg-bg-elevated"
                )}
              >
                <button
                  type="button"
                  ref={(el) => {
                    if (el) rowRefs.current.set(index, el);
                    else rowRefs.current.delete(index);
                  }}
                  onClick={() => {
                    setPreviewId(ph.id);
                    setFocusedIndex(index);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
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
                    </p>
                  </div>
                </button>
                <ListCheckmark
                  selected={isSelected}
                  interactive={interactive}
                  onToggle={
                    onToggleSelect ? () => onToggleSelect(ph.id) : undefined
                  }
                />
              </div>
              {isPreviewing && (
                <div className="lg:hidden border-b border-border">
                  <ListPreview photo={ph} />
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
        <ListPreview photo={previewPhoto} />
      </div>
    </div>
  );
}
