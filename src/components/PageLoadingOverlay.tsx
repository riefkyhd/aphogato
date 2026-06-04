"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageLoadingOverlay({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-bg-primary/92 backdrop-blur-sm px-6",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="h-9 w-9 animate-spin text-text-primary"
        aria-hidden
      />
      <p className="text-[13px] uppercase tracking-label text-text-secondary text-center max-w-xs">
        {message}
      </p>
    </div>
  );
}
