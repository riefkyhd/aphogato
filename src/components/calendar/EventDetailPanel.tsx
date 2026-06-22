"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { useTouchLike } from "@/hooks/useTouchLike";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { formatSyncedAgo } from "@/lib/calendar/parseSyncedAt";
import { Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
import { MaskedMoneyText } from "@/components/privacy/MaskedMoney";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import { ConnectGoogleCalendarButton } from "@/components/calendar/ConnectGoogleCalendarButton";
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
import { FEATURES } from "@/lib/features";
import { sumExpenseAmounts } from "@/lib/finance/projectExpenses";
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
  isOAuthConfigured,
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
  isOAuthConfigured: boolean;
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
  const {
    isLocked,
    moneyVisible,
    pinEnabled,
    guardSensitiveAction,
  } = usePrivacyLockContext();
  const [incomeAmountVisible, setIncomeAmountVisible] = useState(false);
  const showIncome = !isLocked && incomeAmountVisible;
  const expenseTotal = useMemo(
    () => sumExpenseAmounts(eventExpenses),
    [eventExpenses]
  );
  const eventNet = (income?.amount ?? 0) - expenseTotal;
  const showFinanceAmounts = moneyVisible && !isLocked;
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
  const dismissTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !event) return;
    setIncomeAmountVisible(moneyVisible && !isLocked);
    // Init visibility when the panel opens for an event — not on unlock toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- moneyVisible/isLocked read at open only
  }, [open, event?.id]);

  useEffect(() => {
    if (isLocked) setIncomeAmountVisible(false);
  }, [isLocked]);

  useEffect(() => {
    if (!open) {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
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

  useBodyScrollLock(open && touchLike);

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
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = window.setTimeout(() => {
        dismissTimerRef.current = null;
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
      if (
        (e.target as HTMLElement).closest(
          "button, a, input, select, textarea, label, [data-no-panel-drag]"
        )
      ) {
        return;
      }

      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      const onHandle = (e.target as HTMLElement).closest("[data-sheet-handle]");
      if (touchLike && scrollTop > 0 && !onHandle) return;

      dragRef.current = {
        mode: "pending",
        startX: e.clientX,
        startY: e.clientY,
        pointerId: e.pointerId,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [open, event, dismissing, touchLike]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (drag.mode === "none" || drag.pointerId !== e.pointerId) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      if (drag.mode === "pending") {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;

        if (touchLike) {
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
    [resetDrag, touchLike]
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

  const useInlineTransform = dragOffset > 0 || dismissing;
  const panelTransform = useInlineTransform
    ? touchLike
      ? `translateY(${dragOffset}px)`
      : `translateX(${dragOffset}px)`
    : undefined;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-bg-primary/70 backdrop-blur-[2px]",
          "max-md:top-0 md:top-[60px]",
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
          "max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-h-[min(92dvh,calc(100dvh-3.5rem))] max-md:rounded-t-xl max-md:border-t",
          "md:right-0 md:top-[60px] md:bottom-0 md:w-full md:max-w-[380px] md:border-l",
          isDragging || dismissing
            ? "transition-none touch-none"
            : "transition-transform duration-300 ease-out touch-pan-y",
          "max-md:overscroll-y-contain",
          !useInlineTransform &&
            (open && event
              ? "max-md:translate-y-0 md:translate-x-0"
              : "max-md:translate-y-full md:translate-x-full")
        )}
        style={panelTransform ? { transform: panelTransform } : undefined}
        aria-hidden={!open || !event}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {event && (
          <>
            <div
              data-sheet-handle
              className="flex shrink-0 justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing max-md:flex md:hidden"
              aria-hidden
            >
              <div className="h-1 w-10 rounded-full bg-border/80" />
            </div>

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
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[11px] uppercase tracking-label text-text-muted">
                    Client income
                  </p>
                  {income && !financeLoading && (
                    <Tooltip
                      label={
                        isLocked
                          ? "Unlock to view amount"
                          : showIncome
                            ? "Hide amount"
                            : "Show amount"
                      }
                      side="bottom"
                    >
                      <button
                        type="button"
                        data-no-panel-drag
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                        aria-label={
                          isLocked
                            ? "Unlock to view client income"
                            : showIncome
                              ? "Hide client income"
                              : "Show client income"
                        }
                        onClick={() => {
                          guardSensitiveAction(
                            () => setIncomeAmountVisible((v) => !v),
                            {
                              title: "View client income",
                              description:
                                "Enter your privacy PIN to view income on this event.",
                            }
                          );
                        }}
                      >
                        {showIncome ? (
                          <EyeOff className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                    </Tooltip>
                  )}
                </div>
                {financeLoading ? (
                  <p className="text-[12px] text-text-muted animate-pulse">
                    Loading…
                  </p>
                ) : income ? (
                  <>
                    <p className="text-[15px] text-status-delivered tabular-nums">
                      <MaskedMoneyText
                        text={formatMoney(income.amount, income.currency)}
                        visible={showIncome}
                      />
                    </p>
                    {pinEnabled && isLocked && (
                      <p className="mt-1 text-[11px] text-text-muted">
                        Amount hidden — tap the eye icon to unlock.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[12px] text-text-secondary">
                    Not recorded yet — add in Edit
                    {FEATURES.finance ? (
                      <>
                        {" "}
                        or{" "}
                        <Link
                          href="/dashboard/finance"
                          className="text-text-primary hover:underline"
                        >
                          Finance
                        </Link>
                      </>
                    ) : null}
                  </p>
                )}
              </div>

              {!financeLoading && (income || eventExpenses.length > 0) ? (
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-[11px] uppercase tracking-label text-text-muted mb-1">
                    Net margin
                  </p>
                  <p
                    className={cn(
                      "text-[15px] tabular-nums",
                      eventNet >= 0 ? "text-status-delivered" : "text-status-editing"
                    )}
                  >
                    <MaskedMoneyText
                      text={formatMoney(eventNet, income?.currency ?? "IDR")}
                      visible={showFinanceAmounts}
                    />
                  </p>
                  {income && income.amount > 0 && showFinanceAmounts ? (
                    <p className="mt-1 text-[11px] text-text-muted">
                      {Math.round((eventNet / income.amount) * 100)}% after{" "}
                      {formatMoney(expenseTotal, income.currency)} expenses
                    </p>
                  ) : null}
                  <Link
                    href={`/dashboard/finance?event=${encodeURIComponent(event.id)}`}
                    className="mt-2 inline-block text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary"
                  >
                    View in Finance →
                  </Link>
                </div>
              ) : null}

              <LinkedExpensesBlock
                expenses={financeLoading ? [] : eventExpenses}
                events={financeEvents}
                projects={financeProjects}
                defaultEventId={event.id}
                defaultProjectId={event.project_id ?? ""}
                defaultDate={event.shoot_date}
                onChanged={onExpensesChanged}
              />

              {FEATURES.deliverables ? (
              <div className="border-t border-border pt-4 mt-4">
                <DeliverablesChecklist eventId={event.id} compact />
              </div>
              ) : null}

              {FEATURES.googleCalendarSync ? (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-[11px] uppercase tracking-label text-text-muted mb-2">
                  Google Calendar
                </p>
                {!isGoogleConnected ? (
                  <div className="space-y-3">
                    <p className="text-[12px] text-text-secondary">
                      Connect Google, then use{" "}
                      <strong className="font-normal">Sync all</strong> in the
                      toolbar to add shoots to your phone calendar.
                    </p>
                    <ConnectGoogleCalendarButton
                      isOAuthConfigured={isOAuthConfigured}
                      size="sm"
                      fullWidth
                    >
                      Connect Google Calendar
                    </ConnectGoogleCalendarButton>
                  </div>
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
              ) : null}

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
