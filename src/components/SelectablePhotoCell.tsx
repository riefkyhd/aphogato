"use client";

import { useLongPress } from "@/hooks/useLongPress";
import { cn } from "@/lib/utils";

type SelectablePhotoCellProps = {
  children: React.ReactNode;
  selected: boolean;
  selectDisabled?: boolean;
  onToggle: () => void;
  "aria-label": string;
  className?: string;
};

export function SelectablePhotoCell({
  children,
  selected,
  selectDisabled = false,
  onToggle,
  "aria-label": ariaLabel,
  className,
}: SelectablePhotoCellProps) {
  const { longPressHandlers } = useLongPress(() => {
    if (!selectDisabled) onToggle();
  });

  function handleActivate() {
    if (selectDisabled) return;
    onToggle();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate();
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full touch-manipulation group overflow-hidden",
          selectDisabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        )}
        role="button"
        tabIndex={selectDisabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-pressed={selected}
        aria-disabled={selectDisabled}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        {...longPressHandlers}
      >
        {children}
      </div>
    </div>
  );
}
