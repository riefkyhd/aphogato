import { cn } from "@/lib/utils";

export type ProjectStatus = "pending" | "selected" | "editing" | "delivered";

const STATUS_COLOR: Record<ProjectStatus, string> = {
  pending: "#555555",
  selected: "#f0f0f0",
  editing: "#b8860b",
  delivered: "#2e7d32",
};

const STATUS_TEXT: Record<ProjectStatus, string> = {
  pending: "#888888",
  selected: "#f0f0f0",
  editing: "#b8860b",
  delivered: "#2e7d32",
};

export function StatusDot({
  status,
  className,
  showLabel = true,
}: {
  status: ProjectStatus;
  className?: string;
  showLabel?: boolean;
}) {
  const dot = STATUS_COLOR[status] ?? STATUS_COLOR.pending;
  const text = STATUS_TEXT[status] ?? STATUS_TEXT.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[11px] uppercase tracking-label",
        className
      )}
      style={{ color: text }}
    >
      <span
        className="inline-block w-[6px] h-[6px] rounded-full"
        style={{ background: dot }}
        aria-hidden
      />
      {showLabel && <span>{status}</span>}
    </span>
  );
}
