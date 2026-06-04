import { cn } from "@/lib/utils";

/** Small badge when the client has selected this photo (dashboard view). */
export function ClientPickIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute bottom-2 left-2 z-20 px-1.5 py-0.5 bg-white text-bg-primary text-[9px] uppercase tracking-label pointer-events-none",
        className
      )}
      aria-hidden
    >
      Client
    </div>
  );
}
