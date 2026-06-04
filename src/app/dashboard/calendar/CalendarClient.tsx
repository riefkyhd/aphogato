"use client";

import { addMonths, format, isSameMonth, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarListView } from "@/components/calendar/CalendarListView";
import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
import { DeleteEventDialog } from "@/components/calendar/DeleteEventDialog";
import {
  EventDetailPanel,
  type CalendarProject,
} from "@/components/calendar/EventDetailPanel";
import { EventFormModal } from "@/components/calendar/EventFormModal";
import { Button } from "@/components/ui/Button";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "list";

export function CalendarClient({
  initialEvents,
  projects,
  isGoogleConnected,
}: {
  initialEvents: CalendarEvent[];
  projects: CalendarProject[];
  isGoogleConnected: boolean;
}) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [view, setView] = useState<ViewMode>("month");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
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

  const handleSave = useCallback(
    async (payload: Record<string, unknown>) => {
      setSaving(true);
      try {
        if (editingEvent) {
          const res = await fetch(`/api/calendar/events/${editingEvent.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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
          toast.success("Event updated");
        } else {
          const res = await fetch("/api/calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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
          toast.success("Event created");
        }
        setModalOpen(false);
        setEditingEvent(null);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save event"
        );
      } finally {
        setSaving(false);
      }
    },
    [editingEvent]
  );

  const requestDelete = useCallback(() => {
    if (!panelEvent) return;
    setDeleteDialogOpen(true);
  }, [panelEvent]);

  const confirmDelete = useCallback(async () => {
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

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 mb-4 border-b border-border pb-4">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 text-text-muted hover:text-text-primary"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-[13px] uppercase tracking-label text-text-primary min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 text-text-muted hover:text-text-primary"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {view === "month" && (
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
