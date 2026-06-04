"use client";

import { cn } from "@/lib/utils";
import { useLongPress } from "@/hooks/useLongPress";
import type { ManagePhotoActivateMeta } from "@/lib/managePhotoActivate";

type ManagePhotoCellProps = {
  children: React.ReactNode;
  selected: boolean;
  onActivate: (meta: ManagePhotoActivateMeta) => void;
  "aria-label": string;
  className?: string;
};

export function ManagePhotoCell({
  children,
  selected,
  onActivate,
  "aria-label": ariaLabel,
  className,
}: ManagePhotoCellProps) {
  const { longPressHandlers } = useLongPress(() =>
    onActivate({ ctrlKey: false, metaKey: false, longPress: true })
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate({ ctrlKey: e.ctrlKey, metaKey: e.metaKey });
    }
  }

  return (
    <div className={cn("break-inside-avoid mb-[2px] w-full", className)}>
      <div
        className={cn(
          "relative w-full cursor-pointer touch-manipulation group overflow-hidden",
          selected && "ring-2 ring-text-primary ring-offset-1 ring-offset-bg-primary"
        )}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={selected}
        onClick={(e) =>
          onActivate({ ctrlKey: e.ctrlKey, metaKey: e.metaKey })
        }
        onKeyDown={handleKeyDown}
        {...longPressHandlers}
      >
        {children}
      </div>
    </div>
  );
}
