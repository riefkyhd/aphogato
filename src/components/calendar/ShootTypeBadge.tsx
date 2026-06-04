import {
  SHOOT_TYPE_COLORS,
  SHOOT_TYPE_LABELS,
} from "@/lib/calendar/calendarHelpers";
import type { ShootType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ShootTypeBadge({
  shootType,
  className,
}: {
  shootType: ShootType;
  className?: string;
}) {
  const color = SHOOT_TYPE_COLORS[shootType] ?? SHOOT_TYPE_COLORS.other;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[11px] uppercase tracking-label",
        className
      )}
    >
      <span
        className="inline-block h-[6px] w-[6px] rounded-full shrink-0"
        style={{ background: color }}
        aria-hidden
      />
      <span className="text-text-secondary">
        {SHOOT_TYPE_LABELS[shootType]}
      </span>
    </span>
  );
}
