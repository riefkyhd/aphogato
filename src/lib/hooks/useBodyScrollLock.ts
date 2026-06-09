import { useEffect } from "react";

let lockCount = 0;
let savedOverflow: string | null = null;

function applyBodyScrollLock() {
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function clearBodyScrollLock() {
  if (lockCount <= 0) return;
  lockCount -= 1;
  if (lockCount === 0 && savedOverflow !== null) {
    document.body.style.overflow = savedOverflow;
    savedOverflow = null;
  }
}

/** Imperative lock for non-hook callers (e.g. mobile nav). Pair with unlockBodyScroll. */
export function lockBodyScroll() {
  applyBodyScrollLock();
}

export function unlockBodyScroll() {
  clearBodyScrollLock();
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    applyBodyScrollLock();
    return () => {
      clearBodyScrollLock();
    };
  }, [locked]);
}
