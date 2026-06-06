"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTouchLike } from "@/hooks/useTouchLike";
import { cn } from "@/lib/utils";

const DEFAULT_DELAY_MS = 500;

/**
 * Hover/focus tooltip with a delay. Disabled on touch-first devices to avoid
 * accidental tooltips on tap.
 */
export function Tooltip({
  label,
  children,
  className,
  side = "top",
  delayMs = DEFAULT_DELAY_MS,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom";
  delayMs?: number;
}) {
  const touchLike = useTouchLike();
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearShowTimer = useCallback(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearShowTimer();
    setVisible(false);
  }, [clearShowTimer]);

  const show = useCallback(() => {
    if (touchLike) return;
    clearShowTimer();
    showTimer.current = setTimeout(() => setVisible(true), delayMs);
  }, [touchLike, clearShowTimer, delayMs]);

  useEffect(() => () => clearShowTimer(), [clearShowTimer]);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {!touchLike && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm border border-border bg-bg-elevated px-2 py-1 text-[10px] uppercase tracking-label text-text-primary shadow-md transition-opacity duration-150",
            visible ? "opacity-100" : "opacity-0",
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
