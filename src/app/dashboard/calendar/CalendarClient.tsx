"use client";

import {
  addMonths,
  format,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CalendarListView } from "@/components/calendar/CalendarListView";
import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
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

  const handleDelete = useCallback(async () => {
    if (!panelEvent) return;
    if (!window.confirm(`Delete "${panelEvent.title}"?`)) return;
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
      closePanel();
      toast.success("Event deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }, [panelEvent, closePanel]);

  const handleSync = useCallback(async () => {
    if (!panelEvent) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/calendar/sync/${panelEvent.id}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Sync failed");
        return;
      }
      const updated: CalendarEvent = {
        ...panelEvent,
        google_event_id: json.google_event_id,
        synced_at: new Date().toISOString(),
      };
      setEvents((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
      setPanelEvent(updated);
      toast.success("Synced to Google Calendar");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [panelEvent]);

  return (
    <main className="px-4 md:px-8 py-8 min-h-[calc(100vh-60px)] flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-light tracking-[0.05em] uppercase">
          Calendar
        </h1>
        <Button type="button" onClick={() => openNewEvent()}>
          New event
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
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
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setView("month")}
            className={cn(
              "px-3 py-1.5 text-[11px] uppercase tracking-label border border-border transition-colors",
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
              "px-3 py-1.5 text-[11px] uppercase tracking-label border border-border transition-colors",
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
        <div className="flex-1 min-w-0 overflow-auto pr-0 lg:pr-[380px]">
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
          open={Boolean(panelEvent)}
          syncing={syncing}
          onEdit={openEditEvent}
          onDelete={handleDelete}
          onClose={closePanel}
          onSync={handleSync}
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
    </main>
  );
}
