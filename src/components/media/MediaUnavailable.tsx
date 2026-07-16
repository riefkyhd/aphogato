"use client";

import { cn } from "@/lib/utils";

export function MediaUnavailableBanner({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 border border-status-cancelled/40 bg-status-cancelled/10 px-4 py-3",
        className
      )}
      role="alert"
    >
      <p className="text-[11px] uppercase tracking-label text-status-cancelled mb-1.5">
        Storage unavailable
      </p>
      <p className="text-[13px] text-text-primary leading-relaxed">{message}</p>
    </div>
  );
}

export function MediaUnavailableCell({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-[3/4] w-full items-center justify-center bg-bg-elevated px-3 py-4",
        className
      )}
      role="img"
      aria-label={label}
    >
      <p className="text-center text-[11px] uppercase tracking-label text-text-muted leading-relaxed">
        {label}
      </p>
    </div>
  );
}
