"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [previewId, setPreviewId] = useState<string | null>(null);

  const activate = useCallback(
    (photoId: string, meta: ManagePhotoActivateMeta) => {
      const multi = isMultiSelectActivate(meta);

      if (!multi) {
        if (!meta.forceNavigate && previewId === photoId) {
          setPreviewId(null);
          manage.clear();
          return;
        }
        setPreviewId(photoId);
        manage.selectOnly(photoId);
        return;
      }

      manage.toggle(photoId);
      setPreviewId(photoId);
    },
    [previewId, manage]
  );

  const clearAll = useCallback(() => {
    manage.clear();
    setPreviewId(null);
  }, [manage]);

  useEffect(() => {
    if (manage.manageSelected.size === 0) {
      setPreviewId(null);
    }
  }, [manage.manageSelected.size]);

  return { previewId, activate, clearAll };
}
