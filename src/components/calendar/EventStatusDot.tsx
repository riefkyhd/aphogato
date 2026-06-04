import { EVENT_STATUS_COLORS } from "@/lib/calendar/calendarHelpers";
import type { EventStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EventStatusDot({
  status,
  className,
  showLabel = true,
}: {
  status: EventStatus;
  className?: string;
  showLabel?: boolean;
}) {
  const dot = EVENT_STATUS_COLORS[status] ?? EVENT_STATUS_COLORS.scheduled;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[11px] uppercase tracking-label",
        className
      )}
      style={{ color: dot }}
    >
      <span
        className="inline-block h-[6px] w-[6px] rounded-full shrink-0"
        style={{ background: dot }}
        aria-hidden
      />
      {showLabel && <span>{status}</span>}
    </span>
  );
}
