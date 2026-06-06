"use client";

import { useCallback, useEffect, useState } from "react";
import { useTouchLike } from "@/hooks/useTouchLike";
import {
  isMultiSelectActivate,
  type ManagePhotoActivateMeta,
} from "@/lib/managePhotoActivate";

export function useManagePhotoActivation(manage: {
  manageSelected: Set<string>;
  toggle: (id: string) => void;
  selectOnly: (id: string) => void;
  clear: () => void;
}) {
  const { toggle, selectOnly, clear } = manage;
  const [previewId, setPreviewId] = useState<string | null>(null);
  const touchLike = useTouchLike();

  const activate = useCallback(
    (photoId: string, meta: ManagePhotoActivateMeta) => {
      const multi = isMultiSelectActivate(meta);

      if (multi) {
        toggle(photoId);
        setPreviewId(photoId);
        return;
      }

      if (touchLike) {
        if (previewId === photoId && !meta.forceNavigate) {
          setPreviewId(null);
          return;
        }
        setPreviewId(photoId);
        return;
      }

      if (!meta.forceNavigate && previewId === photoId) {
        setPreviewId(null);
        clear();
        return;
      }
      setPreviewId(photoId);
      selectOnly(photoId);
    },
    [previewId, toggle, selectOnly, clear, touchLike]
  );

  const clearAll = useCallback(() => {
    clear();
    setPreviewId(null);
  }, [clear]);

  const closePreview = useCallback(() => {
    setPreviewId(null);
  }, []);

  useEffect(() => {
    if (manage.manageSelected.size === 0) {
      setPreviewId(null);
    }
  }, [manage.manageSelected.size]);

  return { previewId, activate, clearAll, closePreview };
}
