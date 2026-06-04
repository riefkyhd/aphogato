"use client";

import { useCallback, useEffect, useState } from "react";
import { dragEventHasFiles, countDraggedFiles } from "@/lib/imageUploadFiles";

export function usePhotoDropZone({
  enabled,
  onDropFiles,
}: {
  enabled: boolean;
  onDropFiles: (files: FileList) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFileCount, setDraggedFileCount] = useState<number | null>(null);

  const resetDragState = useCallback(() => {
    setIsDragging(false);
    setDraggedFileCount(null);
    document.body.classList.remove("photo-drop-active");
  }, []);

  useEffect(() => {
    if (!enabled) {
      resetDragState();
      return;
    }

    function onDragEnter(e: DragEvent) {
      if (!dragEventHasFiles(e)) return;
      e.preventDefault();
      setIsDragging(true);
      document.body.classList.add("photo-drop-active");
      setDraggedFileCount(countDraggedFiles(e));
    }

    function onDragOver(e: DragEvent) {
      if (!dragEventHasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
      setIsDragging(true);
      setDraggedFileCount(countDraggedFiles(e));
    }

    function onDragLeave(e: DragEvent) {
      if (!dragEventHasFiles(e)) return;
      const related = e.relatedTarget as Node | null;
      if (related && document.documentElement.contains(related)) {
        return;
      }
      resetDragState();
    }

    function onDrop(e: DragEvent) {
      if (!dragEventHasFiles(e)) return;
      e.preventDefault();
      resetDragState();
      if (e.dataTransfer?.files?.length) {
        onDropFiles(e.dataTransfer.files);
      }
    }

    function onDragEnd() {
      resetDragState();
    }

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragend", onDragEnd);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragend", onDragEnd);
      resetDragState();
    };
  }, [enabled, onDropFiles, resetDragState]);

  return { isDragging, draggedFileCount };
}
