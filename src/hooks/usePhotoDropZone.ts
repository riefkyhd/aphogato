"use client";

import { useEffect, useState } from "react";
import { dragEventHasFiles } from "@/lib/imageUploadFiles";

export function usePhotoDropZone({
  enabled,
  onDropFiles,
}: {
  enabled: boolean;
  onDropFiles: (files: FileList) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsDragging(false);
      return;
    }

    let depth = 0;

    function onDragEnter(e: DragEvent) {
      if (!dragEventHasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      if (depth === 1) setIsDragging(true);
    }

    function onDragLeave(e: DragEvent) {
      if (!dragEventHasFiles(e)) return;
      e.preventDefault();
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsDragging(false);
    }

    function onDragOver(e: DragEvent) {
      if (!dragEventHasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    }

    function onDrop(e: DragEvent) {
      if (!dragEventHasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setIsDragging(false);
      if (e.dataTransfer?.files?.length) {
        onDropFiles(e.dataTransfer.files);
      }
    }

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      depth = 0;
      setIsDragging(false);
    };
  }, [enabled, onDropFiles]);

  return { isDragging };
}
