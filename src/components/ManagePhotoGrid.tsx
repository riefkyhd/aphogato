"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { MasonryColumnGrid } from "@/components/MasonryColumnGrid";
import { ClientPickIndicator } from "@/components/ClientPickIndicator";
import { MasonryPhoto } from "@/components/MasonryPhoto";
import { ManagePhotoCell } from "@/components/ManagePhotoCell";
import { ManageSelectionOverlay } from "@/components/ManageSelectionOverlay";
import { useMarqueeSelection } from "@/hooks/useMarqueeSelection";
import type { ManagePhotoActivateMeta } from "@/lib/managePhotoActivate";
import type { Photo } from "@/lib/types";

export function ManagePhotoGrid({
  photos,
  manageSelectedIds,
  onManagePhotoActivate,
  onManagePhotoMarquee,
  onClearManageSelection,
}: {
  photos: Photo[];
  manageSelectedIds: Set<string>;
  onManagePhotoActivate: (id: string, meta: ManagePhotoActivateMeta) => void;
  onManagePhotoMarquee: (ids: string[], mergeBase?: string[]) => void;
  onClearManageSelection: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<string, HTMLElement>());
  const suppressClickRef = useRef(false);
  const manageSelectedRef = useRef(manageSelectedIds);
  const [marqueeEnabled, setMarqueeEnabled] = useState(false);

  manageSelectedRef.current = manageSelectedIds;

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setMarqueeEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const getItemElements = useCallback(() => cellRefs.current, []);

  const getMergeBase = useCallback(
    () => [...manageSelectedRef.current],
    []
  );

  const registerCellRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) cellRefs.current.set(id, el);
    else cellRefs.current.delete(id);
  }, []);

  const { marqueeBox } = useMarqueeSelection({
    enabled: marqueeEnabled,
    containerRef,
    getItemElements,
    onSelect: onManagePhotoMarquee,
    onClear: onClearManageSelection,
    getMergeBase,
    suppressClickRef,
  });

  return (
    <div
      ref={containerRef}
      className="relative min-h-full select-none px-3 sm:px-4 md:px-8"
    >
      <MasonryColumnGrid
        items={photos}
        getKey={(ph) => ph.id}
        renderItem={(ph) => {
          const isManageSelected = manageSelectedIds.has(ph.id);
          return (
            <ManagePhotoCell
              photoId={ph.id}
              registerRef={registerCellRef}
              suppressClickRef={suppressClickRef}
              selected={isManageSelected}
              onActivate={(meta) => onManagePhotoActivate(ph.id, meta)}
              aria-label={`${ph.filename}${isManageSelected ? ", selected for deletion" : ""}`}
            >
              <MasonryPhoto
                src={ph.cloudinary_url}
                alt={ph.filename}
                className="pointer-events-none select-none transition duration-200 group-hover:brightness-105"
              />
              {ph.is_selected && <ClientPickIndicator />}
              {isManageSelected && <ManageSelectionOverlay />}
            </ManagePhotoCell>
          );
        }}
      />

      {marqueeBox && (
        <div
          className="absolute z-[60] border-2 border-text-primary bg-text-primary/15 pointer-events-none"
          style={{
            left: marqueeBox.x,
            top: marqueeBox.y,
            width: marqueeBox.width,
            height: marqueeBox.height,
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
