"use client";

import { useCallback, useRef, useState } from "react";

export const MIN_ZOOM = 1.0;
export const MAX_ZOOM = 4.0;
export const ZOOM_STEP = 0.5;
export const QUICK_ZOOM_SCALE = 2.0;

export function clampZoom(
  z: number,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM
): number {
  const rounded = Math.round(z * 100) / 100;
  return Math.min(maxZoom, Math.max(minZoom, rounded));
}

export type PanCoords = {
  x: number;
  y: number;
};

export type UseImageZoomPanOptions = {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
};

export function useImageZoomPan(options: UseImageZoomPanOptions = {}) {
  const {
    minZoom = MIN_ZOOM,
    maxZoom = MAX_ZOOM,
    initialZoom = 1.0,
    onNavigatePrev,
    onNavigateNext,
  } = options;

  const [zoom, setZoomState] = useState(initialZoom);
  const [pan, setPan] = useState<PanCoords>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Mutable refs to track drag state without stale closure lag
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<PanCoords>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(1.0);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const clamp = useCallback(
    (z: number) => clampZoom(z, minZoom, maxZoom),
    [minZoom, maxZoom]
  );

  const setZoom = useCallback(
    (nextZoom: number | ((prev: number) => number)) => {
      setZoomState((prev) => {
        const target = typeof nextZoom === "function" ? nextZoom(prev) : nextZoom;
        const clamped = clamp(target);
        if (clamped <= 1.0) {
          setPan({ x: 0, y: 0 });
        }
        return clamped;
      });
    },
    [clamp]
  );

  const zoomIn = useCallback(() => {
    setZoom((z) => clamp(z + ZOOM_STEP));
  }, [setZoom, clamp]);

  const zoomOut = useCallback(() => {
    setZoom((z) => clamp(z - ZOOM_STEP));
  }, [setZoom, clamp]);

  const resetZoom = useCallback(() => {
    setZoomState(1.0);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  const toggleQuickZoom = useCallback(() => {
    setZoomState((prev) => {
      if (prev > 1.0) {
        setPan({ x: 0, y: 0 });
        return 1.0;
      }
      return clamp(QUICK_ZOOM_SCALE);
    });
  }, [clamp]);

  // Handle pointer down (mouse or single touch)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;

      if (zoom > 1.0) {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        panStartRef.current = { ...pan };
      } else {
        // Track possible swipe when at 1.0x
        swipeStartRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [zoom, pan]
  );

  // Handle pointer move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging && dragStartRef.current && zoom > 1.0) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPan({
          x: panStartRef.current.x + dx,
          y: panStartRef.current.y + dy,
        });
      }
    },
    [isDragging, zoom]
  );

  // Handle pointer up / cancel
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        setIsDragging(false);
        dragStartRef.current = null;
      }

      // Handle swipe gesture at 1.0x
      if (zoom <= 1.0 && swipeStartRef.current) {
        const dx = e.clientX - swipeStartRef.current.x;
        const dy = e.clientY - swipeStartRef.current.y;
        swipeStartRef.current = null;

        // Minimum swipe distance of 50px horizontally, predominantly horizontal
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0 && onNavigateNext) {
            onNavigateNext();
          } else if (dx > 0 && onNavigatePrev) {
            onNavigatePrev();
          }
        }
      }
    },
    [isDragging, zoom, onNavigateNext, onNavigatePrev]
  );

  // Wheel zoom handler
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Prevent default scrolling of page
      e.preventDefault();
      e.stopPropagation();

      const delta = -e.deltaY;
      const step = delta > 0 ? 0.25 : -0.25;

      setZoom((prev) => clamp(prev + step));
    },
    [setZoom, clamp]
  );

  // Touch pinch-to-zoom handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        initialPinchDistRef.current = dist;
        initialPinchZoomRef.current = zoom;
      }
    },
    [zoom]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDist = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        const ratio = currentDist / initialPinchDistRef.current;
        const targetZoom = initialPinchZoomRef.current * ratio;
        setZoom(clamp(targetZoom));
      }
    },
    [setZoom, clamp]
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchDistRef.current = null;
    }
  }, []);

  return {
    zoom,
    pan,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    toggleQuickZoom,
    zoomPercent: Math.round(zoom * 100),
    isZoomed: zoom > 1.0,
    containerProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
