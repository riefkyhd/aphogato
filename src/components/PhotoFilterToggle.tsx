"use client";

import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function PhotoFilterToggle({
  active,
  onChange,
  className,
}: {
  active: boolean;
  onChange: (active: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      aria-pressed={active}
      aria-label="Selected first"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border text-[11px] uppercase tracking-label transition-colors sm:h-auto sm:w-auto sm:gap-1.5 sm:px-2.5 sm:py-2",
        active
          ? "bg-bg-elevated text-text-primary"
          : "bg-bg-secondary text-text-muted hover:text-text-secondary",
        className
      )}
    >
      <ArrowUpDown className="h-4 w-4 shrink-0" strokeWidth={1.5} />
      <span className="hidden sm:inline">Selected first</span>
    </button>
  );
}
