"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Returns true once the element intersects the viewport (with optional root margin).
 */
export function useIntersectionOnce(options?: {
  rootMargin?: string;
  disabled?: boolean;
}): {
  ref: (node: HTMLElement | null) => void;
  visible: boolean;
} {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (!node || options?.disabled || visible) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            observerRef.current = null;
          }
        },
        { rootMargin: options?.rootMargin ?? "400px 0px" }
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [options?.disabled, options?.rootMargin, visible]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return { ref, visible };
}
