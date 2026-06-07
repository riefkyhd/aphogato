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
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import { LinkedExpensesBlock } from "@/components/finance/LinkedExpensesBlock";
import { DeliverablesChecklist } from "@/components/DeliverablesChecklist";
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

type DragMode = "none" | "pending" | "horizontal" | "vertical";

export function EventDetailPanel({
  event,
  projects,
  isGoogleConnected,
  income,
  eventExpenses,
  financeLoading = false,
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
  financeLoading?: boolean;
  financeEvents: FinanceEventOption[];
  financeProjects: FinanceProjectOption[];
  onExpensesChanged: () => void;
  open: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const touchLike = useTouchLike();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const dragOffsetRef = useRef(0);
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    pointerId: number | null;
  }>({ mode: "none", startX: 0, startY: 0, pointerId: null });

  const useSheet = touchLike;

  useEffect(() => {
    if (!open) {
      setDragOffset(0);
      setIsDragging(false);
      setDismissing(false);
      dragOffsetRef.current = 0;
      dragRef.current = {
        mode: "none",
        startX: 0,
        startY: 0,
        pointerId: null,
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open || !useSheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, useSheet]);

  const resetDrag = useCallback(() => {
    dragRef.current = {
      mode: "none",
      startX: 0,
      startY: 0,
      pointerId: null,
    };
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  }, []);

  const animateDismiss = useCallback(
    (axis: "horizontal" | "vertical") => {
      const panel = panelRef.current;
      const distance =
        axis === "vertical"
          ? panel?.offsetHeight ?? window.innerHeight
          : panel?.offsetWidth ?? window.innerWidth;
      setDismissing(true);
      setIsDragging(false);
      dragOffsetRef.current = distance;
      setDragOffset(distance);
      window.setTimeout(() => {
        onClose();
        setDismissing(false);
        dragOffsetRef.current = 0;
        setDragOffset(0);
      }, 280);
    },
    [onClose]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!open || !event || e.button !== 0 || dismissing) return;

      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      const onHandle = (e.target as HTMLElement).closest("[data-sheet-handle]");
      if (useSheet && scrollTop > 0 && !onHandle) return;

      dragRef.current = {
        mode: "pending",
        startX: e.clientX,
        startY: e.clientY,
        pointerId: e.pointerId,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [open, event, dismissing, useSheet]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (drag.mode === "none" || drag.pointerId !== e.pointerId) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      if (drag.mode === "pending") {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;

        if (useSheet) {
          if (Math.abs(dy) <= Math.abs(dx) || dy < 0) {
            resetDrag();
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            return;
          }
          drag.mode = "vertical";
        } else {
          if (Math.abs(dx) <= Math.abs(dy) || dx < 0) {
            resetDrag();
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            return;
          }
          drag.mode = "horizontal";
        }
        setIsDragging(true);
      }

      if (drag.mode === "vertical" && dy > 0) {
        e.preventDefault();
        dragOffsetRef.current = dy;
        setDragOffset(dy);
      } else if (drag.mode === "horizontal" && dx > 0) {
        e.preventDefault();
        dragOffsetRef.current = dx;
        setDragOffset(dx);
      }
    },
    [resetDrag, useSheet]
  );

  const handlePointerEnd = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (drag.pointerId !== e.pointerId) return;

      if (
        (drag.mode === "vertical" || drag.mode === "horizontal") &&
        dragOffsetRef.current >= DISMISS_DRAG_PX
      ) {
        animateDismiss(drag.mode === "vertical" ? "vertical" : "horizontal");
        dragRef.current = {
          mode: "none",
          startX: 0,
          startY: 0,
          pointerId: null,
        };
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
    [animateDismiss, resetDrag]
  );

  const linkedProject = event?.project_id
    ? projects.find((p) => p.id === event.project_id)
    : null;

  const timeRange = event
    ? formatEventTimeRange(event.shoot_time, event.shoot_end_time)
    : "";

  const panelTransform = (() => {
    if (dragOffset > 0) {
      return useSheet
        ? `translateY(${dragOffset}px)`
        : `translateX(${dragOffset}px)`;
    }
    if (!open || !event) {
      return useSheet ? "translateY(100%)" : "translateX(100%)";
    }
    return useSheet ? "translateY(0)" : "translateX(0)";
  })();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-bg-primary/70 backdrop-blur-[2px]",
          useSheet ? "top-0" : "top-[60px]",
          "transition-opacity duration-300 ease-out",
          open && event ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden={!open || !event}
      />
      <aside
        ref={panelRef}
        className={cn(
          "fixed z-40 bg-bg-secondary border-border shadow-xl flex flex-col",
          useSheet
            ? "inset-x-0 bottom-0 top-auto max-h-[min(92dvh,calc(100dvh-3.5rem))] rounded-t-xl border-t"
            : "right-0 top-[60px] bottom-0 w-full sm:max-w-[380px] border-l",
          isDragging || dismissing
            ? "transition-none touch-none"
            : "transition-transform duration-300 ease-out touch-pan-y",
          useSheet && "overscroll-y-contain"
        )}
        style={{ transform: panelTransform }}
        aria-hidden={!open || !event}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {event && (
          <>
            {useSheet && (
              <div
                data-sheet-handle
                className="flex shrink-0 justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
                aria-hidden
              >
                <div className="h-1 w-10 rounded-full bg-border/80" />
              </div>
            )}

            <div className="sticky top-0 z-10 shrink-0 flex items-start justify-between gap-4 border-b border-border bg-bg-secondary px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="text-base sm:text-lg font-light tracking-[0.05em] uppercase text-text-primary pr-2 min-w-0">
                {event.title}
              </h2>
              <Tooltip label="Close panel">
                <IconButton onClick={onClose} label="Close panel">
                  <X className="h-5 w-5" aria-hidden />
                </IconButton>
              </Tooltip>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 pb-4 sm:px-6 sm:pb-6"
            >
              <dl className="space-y-4 text-[13px] pt-4">
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

              <div className="border-t border-border pt-4 mt-4">
                <p className="text-[11px] uppercase tracking-label text-text-muted mb-1">
                  Client income
                </p>
                {financeLoading ? (
                  <p className="text-[12px] text-text-muted animate-pulse">
                    Loading…
                  </p>
                ) : income ? (
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

              <LinkedExpensesBlock
                expenses={financeLoading ? [] : eventExpenses}
                events={financeEvents}
                projects={financeProjects}
                defaultEventId={event.id}
                defaultProjectId={event.project_id ?? ""}
                defaultDate={event.shoot_date}
                onChanged={onExpensesChanged}
              />

              <div className="border-t border-border pt-4 mt-4">
                <DeliverablesChecklist eventId={event.id} compact />
              </div>

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

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-6 mt-4 border-t border-border [&_button]:w-full [&_button]:sm:flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="!text-status-editing"
                  onClick={onDelete}
                >
                  Delete
                </Button>
                <Button type="button" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
