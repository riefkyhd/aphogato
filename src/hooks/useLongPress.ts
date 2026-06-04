"use client";

import { useRef } from "react";

export function useLongPress(
  onLongPress: () => void,
  { delay = 500 }: { delay?: number } = {}
) {
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return {
    longPressHandlers: {
      onPointerDown: (e: React.PointerEvent) => {
        if (e.pointerType !== "touch") return;
        firedRef.current = false;
        clearTimer();
        timerRef.current = setTimeout(() => {
          firedRef.current = true;
          onLongPress();
        }, delay);
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
