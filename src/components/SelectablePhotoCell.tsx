"use client";

import { useLongPress } from "@/hooks/useLongPress";
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
  const { longPressHandlers } = useLongPress(onToggle);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative w-full cursor-pointer touch-manipulation group overflow-hidden"
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={selected}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        {...longPressHandlers}
      >
        {children}
      </div>
    </div>
  );
}
