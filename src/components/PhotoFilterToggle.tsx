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
        "inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-2 text-[11px] uppercase tracking-label transition-colors",
        active
          ? "bg-bg-elevated text-text-primary"
          : "bg-bg-secondary text-text-muted hover:text-text-secondary",
        className
      )}
    >
      <ArrowUpDown className="h-4 w-4 shrink-0" strokeWidth={1.5} />
      <span>Selected first</span>
    </button>
  );
}
