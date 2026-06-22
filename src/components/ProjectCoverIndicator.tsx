import { cn } from "@/lib/utils";

/** Badge when this photo is the project cover (dashboard + link preview). */
export function ProjectCoverIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute top-2 left-2 z-20 px-1.5 py-0.5 bg-bg-primary/90 text-text-primary border border-border text-[9px] uppercase tracking-label pointer-events-none",
        className
      )}
      aria-hidden
    >
      Cover
    </div>
  );
}
