"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTouchLike } from "@/hooks/useTouchLike";
import { cn } from "@/lib/utils";

const DEFAULT_DELAY_MS = 500;
const GAP_PX = 6;
const VIEWPORT_PADDING = 8;

/**
 * Hover/focus tooltip with a delay. Renders in a portal so labels are not
 * clipped by overflow-hidden ancestors (e.g. collapsible panels).
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
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearShowTimer = useCallback(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      Math.max(centerX, VIEWPORT_PADDING),
      window.innerWidth - VIEWPORT_PADDING
    );

    setCoords({
      top: side === "top" ? rect.top - GAP_PX : rect.bottom + GAP_PX,
      left: clampedLeft,
    });
  }, [side]);

  const hide = useCallback(() => {
    clearShowTimer();
    setVisible(false);
  }, [clearShowTimer]);

  const show = useCallback(() => {
    if (touchLike) return;
    clearShowTimer();
    showTimer.current = setTimeout(() => {
      updatePosition();
      setVisible(true);
    }, delayMs);
  }, [touchLike, clearShowTimer, delayMs, updatePosition]);

  useLayoutEffect(() => {
    if (!visible) return;
    updatePosition();
  }, [visible, updatePosition]);

  useEffect(() => {
    if (!visible) return;

    const onReposition = () => updatePosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [visible, updatePosition]);

  useEffect(() => () => clearShowTimer(), [clearShowTimer]);

  const tooltip =
    mounted && visible && !touchLike
      ? createPortal(
          <span
            role="tooltip"
            className={cn(
              "pointer-events-none fixed z-[200] max-w-[min(90vw,20rem)] -translate-x-1/2 whitespace-nowrap rounded-sm border border-border bg-bg-elevated px-2 py-1 text-center text-[10px] uppercase tracking-label text-text-primary shadow-md",
              side === "top" ? "-translate-y-full" : "translate-y-0"
            )}
            style={{ top: coords.top, left: coords.left }}
          >
            {label}
          </span>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={anchorRef}
        className={cn("relative inline-flex", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {tooltip}
    </>
  );
}
