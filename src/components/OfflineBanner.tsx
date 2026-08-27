"use client";

import { CloudOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-[120] border-t border-status-editing bg-status-editing/15 backdrop-blur px-4 py-2 flex items-center justify-center gap-2 text-[12px] uppercase tracking-label text-status-editing pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
    >
      <CloudOff className="h-3.5 w-3.5" aria-hidden />
      <span>You&apos;re offline — saves are disabled until connection returns.</span>
    </div>
  );
}
