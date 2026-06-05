"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { useTouchLike } from "@/hooks/useTouchLike";
import { formatSyncedAgo } from "@/lib/calendar/parseSyncedAt";
import { X } from "lucide-react";
import Link from "next/link";
import { EventStatusDot } from "@/components/calendar/EventStatusDot";
import { ShootTypeBadge } from "@/components/calendar/ShootTypeBadge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import { LinkedExpensesBlock } from "@/components/finance/LinkedExpensesBlock";
import type {
  FinanceEventOption,
  FinanceProjectOption,
} from "@/lib/finance/financeOptions";
import { formatMoney } from "@/lib/finance/formatMoney";
import type { CalendarEvent, ExpenseEntry, IncomeEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const DISMISS_DRAG_PX = 72;
const AXIS_LOCK_PX = 10;

export type CalendarProject = { id: string; name: string };

type DragMode = "none" | "pending" | "horizontal";

export function EventDetailPanel({
  event,
  projects,
  isGoogleConnected,
  income,
  eventExpenses,
  financeEvents,
  financeProjects,
  onExpensesChanged,
  open,
  onEdit,
  onDelete,
  onClose,
}: {
  event: CalendarEvent | null;
  projects: CalendarProject[];
  isGoogleConnected: boolean;
  income: IncomeEntry | null;
  eventExpenses: ExpenseEntry[];
  financeEvents: FinanceEventOption[];
  financeProjects: FinanceProjectOption[];
  onExpensesChanged: () => void;
  open: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const touchLike = useTouchLike();
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragXRef = useRef(0);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    pointerId: number | null;
  }>({ mode: "none", startX: 0, startY: 0, pointerId: null });

  useEffect(() => {
    if (!open) {
      setDragX(0);
      setIsDragging(false);
      dragXRef.current = 0;
      dragRef.current = {
        mode: "none",
        startX: 0,
        startY: 0,
        pointerId: null,
      };
    }
  }, [open]);

  const resetDrag = useCallback(() => {
    dragRef.current = {
      mode: "none",
      startX: 0,
      startY: 0,
      pointerId: null,
    };
    dragXRef.current = 0;
    setDragX(0);
    setIsDragging(false);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!touchLike || !open || !event || e.button !== 0) return;
      dragRef.current = {
        mode: "pending",
        startX: e.clientX,
        startY: e.clientY,
        pointerId: e.pointerId,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [touchLike, open, event]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (drag.mode === "none" || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (drag.mode === "pending") {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        resetDrag();
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        return;
      }
      drag.mode = "horizontal";
      setIsDragging(true);
    }

    if (drag.mode === "horizontal") {
      e.preventDefault();
      const next = Math.max(0, dx);
      dragXRef.current = next;
      setDragX(next);
    }
  }, [resetDrag]);

  const handlePointerEnd = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (drag.pointerId !== e.pointerId) return;

      if (drag.mode === "horizontal" && dragXRef.current >= DISMISS_DRAG_PX) {
        const width = e.currentTarget.offsetWidth;
        dragXRef.current = width;
        setDragX(width);
        setIsDragging(false);
        dragRef.current = {
          mode: "none",
          startX: 0,
          startY: 0,
          pointerId: null,
        };
        window.setTimeout(() => onClose(), 300);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        return;
      }
      resetDrag();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    [onClose, resetDrag]
  );

  const linkedProject = event?.project_id
    ? projects.find((p) => p.id === event.project_id)
    : null;

  const timeRange = event
    ? formatEventTimeRange(event.shoot_time, event.shoot_end_time)
    : "";

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 top-[60px] z-30 bg-bg-primary/70 backdrop-blur-[2px]",
          "transition-opacity duration-300 ease-out",
          open && event ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden={!open || !event}
      />
      <aside
        className={cn(
          "fixed right-0 top-[60px] bottom-0 z-40 w-full max-w-full sm:max-w-[380px]",
          "bg-bg-secondary border-l border-border shadow-xl",
          "transform duration-300 ease-out",
          isDragging ? "transition-none touch-none" : "transition-transform touch-pan-y",
          open && event && dragX === 0 ? "translate-x-0" : "",
          !open || !event ? "translate-x-full" : ""
        )}
        style={dragX > 0 ? { transform: `translateX(${dragX}px)` } : undefined}
        aria-hidden={!open || !event}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {event && (
          <div className="flex h-full flex-col overflow-y-auto">
            {touchLike && (
              <div
                className="flex shrink-0 justify-center pt-2 pb-1 sm:hidden"
                aria-hidden
              >
                <div className="h-1 w-10 rounded-full bg-border/80" />
              </div>
            )}
            <div className="flex h-full flex-col p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
              <h2 className="text-base sm:text-lg font-light tracking-[0.05em] uppercase text-text-primary pr-2">
                {event.title}
              </h2>
              <Tooltip label="Close panel">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary p-1 shrink-0"
                  aria-label="Close panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </Tooltip>
            </div>

            <dl className="space-y-4 text-[13px] flex-1">
              {event.client_name && (
                <div>
                  <dt className="text-[11px] uppercase tracking-label text-text-muted mb-1">
                    Client
                  </dt>
                  <dd className="text-text-primary">{event.client_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-[11px] uppercase tracking-label text-text-muted mb-1">
                  Shoot type
                </dt>
                <dd>
                  <ShootTypeBadge shootType={event.shoot_type} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-label text-text-muted mb-1">
                  Schedule
                </dt>
                <dd className="text-text-primary">
                  {format(parseISO(event.shoot_date), "EEEE, MMM d, yyyy")}
                  {timeRange ? (
                    <>
                      <br />
                      <span className="text-text-secondary">{timeRange}</span>
                    </>
                  ) : null}
                </dd>
              </div>
              {event.location && (
                <div>
                  <dt className="text-[11px] uppercase tracking-label text-text-muted mb-1">
                    Location
                  </dt>
                  <dd className="text-text-primary">{event.location}</dd>
                </div>
              )}
              <div>
                <dt className="text-[11px] uppercase tracking-label text-text-muted mb-1">
                  Status
                </dt>
                <dd>
                  <EventStatusDot status={event.status} />
                </dd>
              </div>
              {linkedProject && (
                <div>
                  <dt className="text-[11px] uppercase tracking-label text-text-muted mb-1">
                    Project
                  </dt>
                  <dd className="text-text-primary">{linkedProject.name}</dd>
                  <Link
                    href={`/dashboard/${event.project_id}`}
                    className="inline-block mt-2 text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary"
                  >
                    View gallery →
                  </Link>
                </div>
              )}
              {event.notes && (
                <div>
                  <dt className="text-[11px] uppercase tracking-label text-text-muted mb-1">
                    Notes
                  </dt>
                  <dd className="text-text-secondary whitespace-pre-wrap">
                    {event.notes}
                  </dd>
                </div>
              )}
            </dl>

            <div className="border-t border-border pt-4 mt-2">
              <p className="text-[11px] uppercase tracking-label text-text-muted mb-1">
                Client income
              </p>
              {income ? (
                <p className="text-[15px] text-status-delivered tabular-nums">
                  {formatMoney(income.amount, income.currency)}
                </p>
              ) : (
                <p className="text-[12px] text-text-secondary">
                  Not recorded yet — add in Edit or{" "}
                  <Link
                    href="/dashboard/finance"
                    className="text-text-primary hover:underline"
                  >
                    Finance
                  </Link>
                </p>
              )}
            </div>

            {event && (
              <LinkedExpensesBlock
                expenses={eventExpenses}
                events={financeEvents}
                projects={financeProjects}
                defaultEventId={event.id}
                defaultProjectId={event.project_id ?? ""}
                defaultDate={event.shoot_date}
                onChanged={onExpensesChanged}
              />
            )}

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-[11px] uppercase tracking-label text-text-muted mb-2">
                Google Calendar
              </p>
              {!isGoogleConnected ? (
                <p className="text-[12px] text-text-secondary">
                  Connect in{" "}
                  <Link
                    href="/dashboard/settings"
                    className="text-text-primary hover:underline"
                  >
                    Settings
                  </Link>
                  , then use <strong className="font-normal">Sync all</strong>{" "}
                  in the toolbar.
                </p>
              ) : event.google_event_id ? (
                <p className="text-[11px] uppercase tracking-label text-status-delivered">
                  ● Synced
                  {event.synced_at && ` ${formatSyncedAgo(event.synced_at)}`}
                </p>
              ) : (
                <p className="text-[11px] uppercase tracking-label text-text-muted">
                  ● Not synced — use Sync all in the toolbar
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-6 mt-auto border-t border-border">
              <Button type="button" className="flex-1" onClick={onEdit}>
                Edit
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1 !text-status-editing"
                onClick={onDelete}
              >
                Delete
              </Button>
            </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
