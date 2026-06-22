"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "gallery-hint-dismissed:";

export function GalleryClientHint({
  token,
  className,
}: {
  token: string;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(
        window.localStorage.getItem(`${STORAGE_PREFIX}${token}`) === "1"
      );
    } catch {
      setDismissed(false);
    }
  }, [token]);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${token}`, "1");
    } catch {
      // ignore
    }
  }

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "relative rounded-sm border border-border bg-bg-elevated/80 px-3 py-2.5 pr-10 sm:px-4 sm:py-3 sm:pr-12",
        className
      )}
      role="note"
    >
      <p className="text-[13px] leading-relaxed text-text-secondary">
        <span className="sm:hidden">
          Ketuk foto untuk memilih yang ingin diedit. Ketuk lagi untuk membatalkan
          pilihan.
        </span>
        <span className="hidden sm:inline">
          Tap a photo to select the shots you want edited. Tap again to deselect.
        </span>
      </p>
      <button
        type="button"
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center text-text-muted hover:text-text-primary transition-colors sm:right-3 sm:top-3"
        aria-label="Dismiss tips"
        onClick={dismiss}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
