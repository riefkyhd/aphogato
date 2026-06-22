"use client";

import { useEffect, useRef } from "react";

export function LoadMoreSentinel({
  onLoadMore,
  disabled,
}: {
  onLoadMore: () => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "800px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, disabled]);

  return <div ref={ref} className="h-px w-full shrink-0" aria-hidden />;
}
