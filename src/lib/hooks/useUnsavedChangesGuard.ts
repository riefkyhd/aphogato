"use client";

import { useEffect } from "react";

/**
 * Warn on browser tab close / reload when `dirty` is true.
 *
 * Note: In-app navigation (Next.js `<Link>` / `router.push`) is not
 * covered by `beforeunload`. For those, consumers should also render
 * a `<ConfirmDialog>` triggered from the navigation intent.
 */
export function useUnsavedChangesGuard(dirty: boolean, message?: string) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chromium ignores custom messages; setting returnValue is enough.
      event.returnValue = message ?? "";
      return message ?? "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, message]);
}
