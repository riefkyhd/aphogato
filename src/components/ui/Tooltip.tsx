"use client";

import { cn } from "@/lib/utils";

/**
 * Wraps icon-only or compact controls with a hover/focus tooltip.
 * Also sets native title for long-press on touch devices.
 */
export function Tooltip({
  label,
  children,
  className,
  side = "top",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom";
}) {
  return (
    <span
      className={cn("group/tooltip relative inline-flex", className)}
      title={label}
    >
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm border border-border bg-bg-elevated px-2 py-1 text-[10px] uppercase tracking-label text-text-primary opacity-0 shadow-md transition-opacity duration-150",
          "group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        )}
      >
        {label}
      </span>
    </span>
  );
}
