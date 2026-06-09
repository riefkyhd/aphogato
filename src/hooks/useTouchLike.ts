"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  const coarse = window.matchMedia("(pointer: coarse)");
  const narrow = window.matchMedia("(max-width: 767px)");
  coarse.addEventListener("change", callback);
  narrow.addEventListener("change", callback);
  return () => {
    coarse.removeEventListener("change", callback);
    narrow.removeEventListener("change", callback);
  };
}

function getTouchLikeSnapshot(): boolean {
  const coarse = window.matchMedia("(pointer: coarse)");
  const narrow = window.matchMedia("(max-width: 767px)");
  return coarse.matches || narrow.matches;
}

/** Touch-first devices and narrow viewports (coarse pointer or phone-width). */
export function useTouchLike(): boolean {
  return useSyncExternalStore(
    subscribe,
    getTouchLikeSnapshot,
    () => false
  );
}
