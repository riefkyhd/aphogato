"use client";

import { useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import { sortPhotosNewestFirst } from "@/lib/sortPhotos";
import type { Photo } from "@/lib/types";

/** Keep client photo state aligned with server props after router.refresh(), without clobbering newer client data while cache is stale. */
export function useSyncServerPhotos(
  initialPhotos: Photo[],
  setPhotos: Dispatch<SetStateAction<Photo[]>>
) {
  const serverSignature = useMemo(
    () =>
      initialPhotos
        .map((p) => `${p.id}:${p.created_at}`)
        .join("|"),
    [initialPhotos]
  );

  useEffect(() => {
    const next = sortPhotosNewestFirst(initialPhotos);
    setPhotos((prev) => {
      if (next.length === 0 && prev.length > 0) {
        return prev;
      }
      if (next.length >= prev.length) {
        return next;
      }
      const prevIds = new Set(prev.map((p) => p.id));
      const serverIsSubset = next.every((p) => prevIds.has(p.id));
      if (serverIsSubset && prev.length > next.length) {
        return prev;
      }
      return next;
    });
  }, [serverSignature, setPhotos, initialPhotos]);
}
