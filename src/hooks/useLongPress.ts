"use client";

import { useRef } from "react";

export function useLongPress(
  onLongPress: () => void,
  {
    delay = 450,
    suppressClickRef,
  }: { delay?: number; suppressClickRef?: React.MutableRefObject<boolean> } = {}
) {
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function fire() {
    firedRef.current = true;
    if (suppressClickRef) suppressClickRef.current = true;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
    onLongPress();
  }

  return {
    longPressHandlers: {
      onContextMenu: (e: React.SyntheticEvent) => {
        e.preventDefault();
      },
      onPointerDown: (e: React.PointerEvent) => {
        if (e.pointerType !== "touch") return;
        firedRef.current = false;
        clearTimer();
        timerRef.current = setTimeout(fire, delay);
      },
      onPointerUp: clearTimer,
      onPointerLeave: clearTimer,
      onPointerCancel: clearTimer,
      onClickCapture: (e: React.MouseEvent) => {
        if (firedRef.current) {
          e.preventDefault();
          e.stopPropagation();
          firedRef.current = false;
        }
      },
    },
  };
}
