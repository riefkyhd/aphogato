"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD_PX = 4;
const SCROLL_PARENT_SELECTOR = "[data-photo-grid-scroll]";

export type MarqueeBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ContentPoint = { x: number; y: number };

type DragState = {
  /** Fixed anchor in scroll-content space (stays on first mousedown while scrolling). */
  start: ContentPoint;
  startClientX: number;
  startClientY: number;
  additive: boolean;
  dragged: boolean;
  mergeBase?: string[];
  lastClientX: number;
  lastClientY: number;
  /** Container top-left in scroll-content space at drag start. */
  containerAnchor: ContentPoint;
};

function clientRectsIntersect(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number }
): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function getScrollParent(container: HTMLElement): HTMLElement | null {
  return container.closest<HTMLElement>(SCROLL_PARENT_SELECTOR);
}

function clientToScrollContent(
  clientX: number,
  clientY: number,
  scrollEl: HTMLElement
): ContentPoint {
  const rect = scrollEl.getBoundingClientRect();
  return {
    x: clientX - rect.left + scrollEl.scrollLeft,
    y: clientY - rect.top + scrollEl.scrollTop,
  };
}

function containerAnchorInScrollContent(
  container: HTMLElement,
  scrollEl: HTMLElement
): ContentPoint {
  const scrollRect = scrollEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return {
    x: containerRect.left - scrollRect.left + scrollEl.scrollLeft,
    y: containerRect.top - scrollRect.top + scrollEl.scrollTop,
  };
}

function contentToContainerLocal(
  point: ContentPoint,
  anchor: ContentPoint
): ContentPoint {
  return { x: point.x - anchor.x, y: point.y - anchor.y };
}

function boxFromContentPoints(
  start: ContentPoint,
  end: ContentPoint,
  anchor: ContentPoint
): MarqueeBox {
  const a = contentToContainerLocal(start, anchor);
  const b = contentToContainerLocal(end, anchor);
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  return {
    x: left,
    y: top,
    width: Math.max(Math.abs(b.x - a.x), 1),
    height: Math.max(Math.abs(b.y - a.y), 1),
  };
}

function elementRectInScrollContent(
  el: HTMLElement,
  scrollEl: HTMLElement
): { left: number; top: number; right: number; bottom: number } {
  const elRect = el.getBoundingClientRect();
  const scrollRect = scrollEl.getBoundingClientRect();
  const left = elRect.left - scrollRect.left + scrollEl.scrollLeft;
  const top = elRect.top - scrollRect.top + scrollEl.scrollTop;
  return {
    left,
    top,
    right: left + elRect.width,
    bottom: top + elRect.height,
  };
}

function hitsInContentRect(
  start: ContentPoint,
  end: ContentPoint,
  scrollEl: HTMLElement,
  getItemElements: () => Map<string, HTMLElement>
): string[] {
  const selectionRect = {
    left: Math.min(start.x, end.x),
    top: Math.min(start.y, end.y),
    right: Math.max(start.x, end.x),
    bottom: Math.max(start.y, end.y),
  };

  const hits: string[] = [];
  for (const [id, el] of getItemElements()) {
    const r = elementRectInScrollContent(el, scrollEl);
    if (clientRectsIntersect(selectionRect, r)) {
      hits.push(id);
    }
  }
  return hits;
}

export function useMarqueeSelection({
  enabled,
  containerRef,
  getItemElements,
  onSelect,
  onClear,
  getMergeBase,
  suppressClickRef,
}: {
  enabled: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  getItemElements: () => Map<string, HTMLElement>;
  onSelect: (ids: string[], mergeBase?: string[]) => void;
  onClear: () => void;
  getMergeBase?: () => string[];
  suppressClickRef?: React.MutableRefObject<boolean>;
}) {
  const [marqueeBox, setMarqueeBox] = useState<MarqueeBox | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const onSelectRef = useRef(onSelect);
  const onClearRef = useRef(onClear);
  const getItemElementsRef = useRef(getItemElements);
  const getMergeBaseRef = useRef(getMergeBase);

  onSelectRef.current = onSelect;
  onClearRef.current = onClear;
  getItemElementsRef.current = getItemElements;
  getMergeBaseRef.current = getMergeBase;

  const updateFromDrag = useCallback(
    (
      drag: DragState,
      scrollEl: HTMLElement,
      clientX: number,
      clientY: number
    ) => {
      drag.lastClientX = clientX;
      drag.lastClientY = clientY;
      const end = clientToScrollContent(clientX, clientY, scrollEl);
      setMarqueeBox(
        boxFromContentPoints(drag.start, end, drag.containerAnchor)
      );
      if (drag.dragged) {
        const hits = hitsInContentRect(
          drag.start,
          end,
          scrollEl,
          getItemElementsRef.current
        );
        if (hits.length > 0) {
          onSelectRef.current(hits, drag.mergeBase);
        } else if (!drag.mergeBase) {
          onClearRef.current();
        }
      }
    },
    []
  );

  const finishDrag = useCallback(
    (
      scrollEl: HTMLElement | null,
      endX: number,
      endY: number,
      target: EventTarget | null
    ) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setMarqueeBox(null);

      if (!drag) return;

      if (!drag.dragged) {
        if (
          target instanceof HTMLElement &&
          !target.closest("[data-photo-cell]")
        ) {
          onClearRef.current();
        }
        return;
      }

      if (suppressClickRef) suppressClickRef.current = true;
      if (scrollEl) {
        const end = clientToScrollContent(endX, endY, scrollEl);
        const hits = hitsInContentRect(
          drag.start,
          end,
          scrollEl,
          getItemElementsRef.current
        );
        if (hits.length > 0) {
          onSelectRef.current(hits, drag.mergeBase);
        } else if (!drag.mergeBase) {
          onClearRef.current();
        }
      }
    },
    [suppressClickRef]
  );

  useEffect(() => {
    if (!enabled) {
      dragRef.current = null;
      setMarqueeBox(null);
      return;
    }

    const root = containerRef.current;
    if (!root) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (
        (e.target as HTMLElement).closest(
          "button, a, input, textarea, select, [data-marquee-ignore]"
        )
      ) {
        return;
      }

      const scrollEl = getScrollParent(root);
      if (!scrollEl) return;

      e.preventDefault();
      const additive = e.ctrlKey || e.metaKey;
      const start = clientToScrollContent(e.clientX, e.clientY, scrollEl);
      dragRef.current = {
        start,
        startClientX: e.clientX,
        startClientY: e.clientY,
        additive,
        dragged: false,
        mergeBase: additive ? getMergeBaseRef.current?.() : undefined,
        lastClientX: e.clientX,
        lastClientY: e.clientY,
        containerAnchor: containerAnchorInScrollContent(root, scrollEl),
      };
      setMarqueeBox(
        boxFromContentPoints(
          start,
          start,
          dragRef.current.containerAnchor
        )
      );

      const onScroll = () => {
        const drag = dragRef.current;
        if (!drag?.dragged) return;
        updateFromDrag(
          drag,
          scrollEl,
          drag.lastClientX,
          drag.lastClientY
        );
      };

      const onMouseMove = (ev: MouseEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        if (
          !drag.dragged &&
          (Math.abs(ev.clientX - drag.startClientX) > DRAG_THRESHOLD_PX ||
            Math.abs(ev.clientY - drag.startClientY) > DRAG_THRESHOLD_PX)
        ) {
          drag.dragged = true;
          if (suppressClickRef) suppressClickRef.current = true;
        }
        updateFromDrag(drag, scrollEl, ev.clientX, ev.clientY);
      };

      const onMouseUp = (ev: MouseEvent) => {
        finishDrag(scrollEl, ev.clientX, ev.clientY, ev.target);
        scrollEl.removeEventListener("scroll", onScroll);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      scrollEl.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    root.addEventListener("mousedown", onMouseDown, true);
    return () => {
      root.removeEventListener("mousedown", onMouseDown, true);
      dragRef.current = null;
      setMarqueeBox(null);
    };
  }, [
    enabled,
    containerRef,
    finishDrag,
    updateFromDrag,
    suppressClickRef,
  ]);

  return { marqueeBox };
}
