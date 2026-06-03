"use client";

import { cn } from "@/lib/utils";

type SelectablePhotoCellProps = {
  children: React.ReactNode;
  selected: boolean;
  onToggle: () => void;
  "aria-label": string;
  className?: string;
};

export function SelectablePhotoCell({
  children,
  selected,
  onToggle,
  "aria-label": ariaLabel,
  className,
}: SelectablePhotoCellProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  }

  return (
    <div className={cn("break-inside-avoid mb-[2px] w-full", className)}>
      <div
        className="relative w-full cursor-pointer touch-manipulation group overflow-hidden"
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={selected}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );
}
