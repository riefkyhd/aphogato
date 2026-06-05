"use client";

import {
  addMonths,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Download, Info } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserPreferencesContext } from "@/components/preferences/UserPreferencesProvider";
import { toast } from "sonner";
import { CalendarListView } from "@/components/calendar/CalendarListView";
import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
import { DeleteEventDialog } from "@/components/calendar/DeleteEventDialog";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import {
  EventDetailPanel,
  type CalendarProject,
} from "@/components/calendar/EventDetailPanel";
import { EventFormModal } from "@/components/calendar/EventFormModal";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { downloadCalendarList } from "@/lib/calendar/exportCalendarList";
import type { FinanceEventOption } from "@/lib/finance/financeOptions";
import { parseMoneyInput } from "@/lib/finance/formatMoney";
import { filterExpensesForEvent } from "@/lib/finance/projectExpenses";
import { normalizeExpense } from "@/lib/finance/normalize";
import type { CalendarEvent, ExpenseEntry, IncomeEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "list";

export function CalendarClient({
  initialEvents,
  projects,
  initialIncomeByEventId,
  initialExpenses,
  isGoogleConnected,
}: {
  initialEvents: CalendarEvent[];
  projects: CalendarProject[];
  initialIncomeByEventId: Record<string, IncomeEntry>;
  initialExpenses: ExpenseEntry[];
  isGoogleConnected: boolean;
}) {
  const { guardSensitiveAction } = usePrivacyLockContext();
  const { preferences, loaded: prefsLoaded } = useUserPreferencesContext();
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [incomeByEventId, setIncomeByEventId] = useState(
    initialIncomeByEventId
  );
  const [expenses, setExpenses] = useState(initialExpenses);
  const [view, setView] = useState<ViewMode>("month");
  const [viewInitialized, setViewInitialized] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  useEffect(() => {
    if (prefsLoaded && !viewInitialized) {
      setView(preferences.defaultCalendarView);
      setViewInitialized(true);
    }
  }, [prefsLoaded, preferences.defaultCalendarView, viewInitialized]);
  const [panelEvent, setPanelEvent] = useState<CalendarEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formInitialDate, setFormInitialDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const panelOpen = Boolean(panelEvent);
  const viewingTodayMonth = isSameMonth(currentMonth, new Date());
  const unsyncedCount = useMemo(
    () => events.filter((e) => !e.google_event_id).length,
    [events]
  );

  const exportEvents = useMemo(() => {
    if (view === "list") return events;
    return events.filter((e) =>
      isSameMonth(parseISO(e.shoot_date), currentMonth)
    );
  }, [events, view, currentMonth]);

  const openEvent = useCallback((ev: CalendarEvent) => {
    setPanelEvent(ev);
  }, []);

  const closePanel = useCallback(() => {
    setPanelEvent(null);
  }, []);

  const openNewEvent = useCallback((date?: Date) => {
    setEditingEvent(null);
    setFormInitialDate(date ?? null);
    setModalOpen(true);
  }, []);

  const openEditEvent = useCallback(() => {
    if (!panelEvent) return;
    setEditingEvent(panelEvent);
    setFormInitialDate(null);
    setModalOpen(true);
  }, [panelEvent]);

  const saveEventIncome = useCallback(
    async (
      eventId: string,
      incomeRaw: unknown,
      shootDate: string,
      clientName: string | null
    ) => {
      const raw =
        typeof incomeRaw === "string" ? incomeRaw.trim() : "";
      if (!raw) return;
      const amount = parseMoneyInput(raw);
      if (amount === null) {
        toast.error("Invalid income amount");
        throw new Error("invalid income");
      }
      const res = await fetch("/api/finance/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          amount,
          entry_date: shootDate,
          client_name: clientName,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to save income");
        throw new Error("income save failed");
      }
      const entry = json as IncomeEntry;
      setIncomeByEventId((prev) => ({ ...prev, [eventId]: entry }));
    },
    []
  );

  const handleSave = useCallback(
    async (payload: Record<string, unknown>) => {
      const { income_amount: incomeRaw, ...eventPayload } = payload;
      setSaving(true);
      try {
        if (editingEvent) {
          const res = await fetch(`/api/calendar/events/${editingEvent.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventPayload),
          });
          const json = await res.json();
          if (!res.ok) {
            toast.error(json.error ?? "Failed to update event");
            return;
          }
          const updated = json as CalendarEvent;
          setEvents((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e))
          );
          setPanelEvent((p) => (p?.id === updated.id ? updated : p));
          await saveEventIncome(
            updated.id,
            incomeRaw,
            updated.shoot_date,
            updated.client_name
          );
          toast.success("Event updated");
        } else {
          const res = await fetch("/api/calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventPayload),
          });
          const json = await res.json();
          if (!res.ok) {
            toast.error(json.error ?? "Failed to create event");
            return;
          }
          const created = json as CalendarEvent;
          setEvents((prev) =>
            [...prev, created].sort((a, b) =>
              a.shoot_date.localeCompare(b.shoot_date)
            )
          );
          await saveEventIncome(
            created.id,
            incomeRaw,
            created.shoot_date,
            created.client_name
          );
          toast.success("Event created");
        }
        setModalOpen(false);
        setEditingEvent(null);
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message === "invalid income" || err.message === "income save failed")
        ) {
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Failed to save event"
        );
      } finally {
        setSaving(false);
      }
    },
    [editingEvent, saveEventIncome]
  );

  const financeEvents: FinanceEventOption[] = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        shoot_date: e.shoot_date,
        client_name: e.client_name,
        project_id: e.project_id,
      })),
    [events]
  );

  const refreshExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/finance/expenses");
      const json = await res.json();
      if (!res.ok || !Array.isArray(json)) return;
      setExpenses(json.map((row: ExpenseEntry) => normalizeExpense(row)));
    } catch {
      // ignore
    }
  }, []);

  const panelIncome = panelEvent
    ? incomeByEventId[panelEvent.id] ?? null
    : null;
  const panelExpenses = panelEvent
    ? filterExpensesForEvent(expenses, panelEvent.id)
    : [];
  const editIncomeAmount = editingEvent
    ? incomeByEventId[editingEvent.id]?.amount != null
      ? String(incomeByEventId[editingEvent.id]!.amount)
      : ""
    : "";

  const requestDelete = useCallback(() => {
    if (!panelEvent) return;
    setDeleteDialogOpen(true);
  }, [panelEvent]);

  const executeDelete = useCallback(async () => {
    if (!panelEvent) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/calendar/events/${panelEvent.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to delete event");
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== panelEvent.id));
      setDeleteDialogOpen(false);
      closePanel();
      toast.success("Event deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }, [panelEvent, closePanel]);

  const confirmDelete = useCallback(() => {
    guardSensitiveAction(() => void executeDelete(), {
      title: "Delete event",
      description: "Enter your privacy PIN to delete this calendar event.",
    });
  }, [guardSensitiveAction, executeDelete]);

  const handleGlobalSync = useCallback(async () => {
    if (!isGoogleConnected) {
      toast.error("Connect Google Calendar in Settings first");
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync-all", { method: "POST" });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      if (Array.isArray(json.events)) {
        setEvents(json.events as CalendarEvent[]);
        setPanelEvent((p) => {
          if (!p) return p;
          const next = (json.events as CalendarEvent[]).find(
            (e) => e.id === p.id
          );
          return next ?? p;
        });
      }
      const synced = json.synced ?? 0;
      const errors = (json.errors ?? []) as string[];
      if (errors.length > 0) {
        toast.warning(
          `Synced ${synced} event${synced === 1 ? "" : "s"}. ${errors.length} failed.`
        );
      } else if (synced > 0) {
        toast.success(
          `Synced ${synced} event${synced === 1 ? "" : "s"} to Google Calendar`
        );
      } else {
        toast.message("All events are already up to date on Google");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [isGoogleConnected]);

  return (
    <main className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100vh-60px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase">
          Calendar
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="!text-[11px] flex-1 sm:flex-none min-w-0"
            onClick={() => {
              if (exportEvents.length === 0) {
                toast.error("No events to export for this view");
                return;
              }
              downloadCalendarList(
                exportEvents,
                view === "month"
                  ? `calendar-${format(currentMonth, "yyyy-MM")}.txt`
                  : undefined
              );
              toast.success("Calendar list downloaded");
            }}
          >
            <Download className="h-3.5 w-3.5 mr-1.5 inline" aria-hidden />
            Download list
          </Button>
          {isGoogleConnected ? (
            <Button
              type="button"
              variant="secondary"
              loading={syncing}
              className="!text-[11px] flex-1 sm:flex-none min-w-0"
              onClick={handleGlobalSync}
            >
              Sync all
              {unsyncedCount > 0 ? ` (${unsyncedCount})` : ""}
            </Button>
          ) : (
            <Link
              href="/dashboard/settings"
              className="btn-secondary !text-[11px] inline-flex items-center justify-center px-4 h-10 flex-1 sm:flex-none"
            >
              Connect Google
            </Link>
          )}
          <Button
            type="button"
            onClick={() => openNewEvent()}
            className="flex-1 sm:flex-none"
          >
            New event
          </Button>
        </div>
      </div>

      <div className="mb-4 rounded-sm border border-border bg-bg-secondary px-3 py-2.5 sm:px-4">
        <div className="flex gap-2 text-[12px] text-text-secondary leading-relaxed">
          <Info className="h-4 w-4 shrink-0 text-text-muted mt-0.5" aria-hidden />
          <p>
            <span className="text-text-primary font-medium">Download list</span>{" "}
            saves a plain-text schedule you can share or print (
            {view === "month" ? "current month" : "all events"}).{" "}
            {isGoogleConnected ? (
              <>
                <span className="text-text-primary font-medium">Sync all</span>{" "}
                pushes shoots to Google Calendar for phone reminders.
              </>
            ) : (
              <>
                Connect Google in Settings to sync shoots to your phone calendar.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 mb-4 border-b border-border pb-4">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <Tooltip label="Previous month">
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="p-2 text-text-muted hover:text-text-primary"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Tooltip>
          <span className="text-[13px] uppercase tracking-label text-text-primary min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Tooltip label="Next month">
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="p-2 text-text-muted hover:text-text-primary"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </Tooltip>
          {view === "month" && (
            <Tooltip label="Jump to current month">
              <button
                type="button"
                onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                disabled={viewingTodayMonth}
                className={cn(
                  "ml-1 px-2.5 py-1 text-[11px] uppercase tracking-label border border-border transition-colors",
                  viewingTodayMonth
                    ? "text-text-muted opacity-50 cursor-default"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                )}
                aria-label="Go to today"
              >
                Today
              </button>
            </Tooltip>
          )}
        </div>
        <div className="flex gap-1 justify-center sm:justify-end">
          <button
            type="button"
            onClick={() => setView("month")}
            className={cn(
              "flex-1 sm:flex-none px-3 py-1.5 text-[11px] uppercase tracking-label border border-border transition-colors",
              view === "month"
                ? "bg-bg-elevated text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex-1 sm:flex-none px-3 py-1.5 text-[11px] uppercase tracking-label border border-border transition-colors",
              view === "list"
                ? "bg-bg-elevated text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            List
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        <div
          className={cn(
            "flex-1 min-w-0 overflow-auto transition-[padding] duration-300",
            panelOpen ? "lg:pr-[380px]" : "pr-0"
          )}
        >
          {view === "month" ? (
            <CalendarMonthGrid
              events={events}
              currentMonth={currentMonth}
              onEventClick={openEvent}
              onDayClick={(date) => openNewEvent(date)}
            />
          ) : (
            <CalendarListView events={events} onEventClick={openEvent} />
          )}
        </div>
        <EventDetailPanel
          event={panelEvent}
          projects={projects}
          isGoogleConnected={isGoogleConnected}
          income={panelIncome}
          eventExpenses={panelExpenses}
          financeEvents={financeEvents}
          financeProjects={projects}
          onExpensesChanged={() => void refreshExpenses()}
          open={panelOpen}
          onEdit={openEditEvent}
          onDelete={requestDelete}
          onClose={closePanel}
        />
      </div>

      <EventFormModal
        open={modalOpen}
        initialDate={formInitialDate}
        event={editingEvent}
        projects={projects}
        initialIncomeAmount={editIncomeAmount}
        saving={saving}
        onSave={handleSave}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditingEvent(null);
          }
        }}
      />

      <DeleteEventDialog
        open={deleteDialogOpen}
        title={panelEvent?.title ?? ""}
        wasSynced={Boolean(panelEvent?.google_event_id)}
        isGoogleConnected={isGoogleConnected}
        deleting={deleting}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
