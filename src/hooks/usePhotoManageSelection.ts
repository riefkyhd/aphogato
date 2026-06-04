"use client";

import { useCallback, useEffect, useState } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function usePhotoManageSelection(photoIds: string[]) {
  const [manageSelected, setManageSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setManageSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectOnly = useCallback((id: string) => {
    setManageSelected(new Set([id]));
  }, []);

  const selectAll = useCallback(() => {
    setManageSelected(new Set(photoIds));
  }, [photoIds]);

  const clear = useCallback(() => {
    setManageSelected(new Set());
  }, []);

  useEffect(() => {
    setManageSelected((prev) => {
      const valid = new Set(photoIds);
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [photoIds]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        e.stopPropagation();
        selectAll();
        window.getSelection()?.removeAllRanges();
      }
      if (e.key === "Escape") {
        clear();
      }
    }
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [selectAll, clear]);

  return {
    manageSelected,
    toggle,
    selectOnly,
    selectAll,
    clear,
    count: manageSelected.size,
  };
}
