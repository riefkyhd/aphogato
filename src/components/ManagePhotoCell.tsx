"use client";

import { cn } from "@/lib/utils";
import { useLongPress } from "@/hooks/useLongPress";
import type { ManagePhotoActivateMeta } from "@/lib/managePhotoActivate";

type ManagePhotoCellProps = {
  photoId: string;
  registerRef?: (id: string, el: HTMLElement | null) => void;
  suppressClickRef?: React.MutableRefObject<boolean>;
  children: React.ReactNode;
  selected: boolean;
  onActivate: (meta: ManagePhotoActivateMeta) => void;
  "aria-label": string;
  className?: string;
};

export function ManagePhotoCell({
  photoId,
  registerRef,
  suppressClickRef,
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
    <div className={cn("w-full", className)}>
      <div
        ref={(el) => registerRef?.(photoId, el)}
        data-photo-cell
        className={cn(
          "relative w-full cursor-pointer touch-manipulation group overflow-hidden",
          selected && "ring-2 ring-text-primary ring-offset-1 ring-offset-bg-primary"
        )}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={selected}
        onClick={(e) => {
          if (suppressClickRef?.current) {
            suppressClickRef.current = false;
            return;
          }
          onActivate({ ctrlKey: e.ctrlKey, metaKey: e.metaKey });
        }}
        onKeyDown={handleKeyDown}
        {...longPressHandlers}
      >
        {children}
      </div>
    </div>
  );
}
