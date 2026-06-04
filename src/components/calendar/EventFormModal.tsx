"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import {
  EVENT_STATUSES,
  SHOOT_TYPE_LABELS,
  SHOOT_TYPES,
} from "@/lib/calendar/calendarHelpers";
import type { CalendarProject } from "@/components/calendar/EventDetailPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { CalendarEvent, EventStatus, ShootType } from "@/lib/types";
import { cn } from "@/lib/utils";

const selectClass = "input-dark w-full";

export function EventFormModal({
  open,
  initialDate,
  event,
  projects,
  saving,
  onSave,
  onClose,
}: {
  open: boolean;
  initialDate?: Date | null;
  event?: CalendarEvent | null;
  projects: CalendarProject[];
  saving: boolean;
  onSave: (payload: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const isEdit = Boolean(event);

  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [shootType, setShootType] = useState<ShootType>("other");
  const [location, setLocation] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [shootTime, setShootTime] = useState("");
  const [status, setStatus] = useState<EventStatus>("scheduled");
  const [notes, setNotes] = useState("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setClientName(event.client_name ?? "");
      setShootType(event.shoot_type);
      setLocation(event.location ?? "");
      setShootDate(event.shoot_date);
      setShootTime(event.shoot_time ?? "");
      setStatus(event.status);
      setNotes(event.notes ?? "");
      setProjectId(event.project_id ?? "");
    } else {
      setTitle("");
      setClientName("");
      setShootType("other");
      setLocation("");
      setShootDate(
        initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
      );
      setShootTime("");
      setStatus("scheduled");
      setNotes("");
      setProjectId("");
    }
  }, [open, event, initialDate]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !saving) onClose();
    },
    [open, saving, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      title,
      client_name: clientName || null,
      shoot_type: shootType,
      location: location || null,
      shoot_date: shootDate,
      shoot_time: shootTime || null,
      status,
      notes: notes || null,
      project_id: projectId || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bg-primary/85 backdrop-blur-sm p-4"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        className="relative w-full max-w-[540px] my-8 bg-bg-elevated border border-border p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-title"
      >
        <h2
          id="event-form-title"
          className="text-lg font-light tracking-[0.05em] uppercase mb-6"
        >
          {isEdit ? "Edit event" : "New event"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="ev-client">Client name</Label>
            <Input
              id="ev-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ev-type">Shoot type</Label>
              <select
                id="ev-type"
                className={selectClass}
                value={shootType}
                onChange={(e) => setShootType(e.target.value as ShootType)}
              >
                {SHOOT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SHOOT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="ev-status">Status</Label>
              <select
                id="ev-status"
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
              >
                {EVENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ev-date">Shoot date</Label>
              <Input
                id="ev-date"
                type="date"
                value={shootDate}
                onChange={(e) => setShootDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ev-time">Shoot time</Label>
              <Input
                id="ev-time"
                type="time"
                value={shootTime}
                onChange={(e) => setShootTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="ev-location">Location</Label>
            <Input
              id="ev-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ev-project">Project</Label>
            <select
              id="ev-project"
              className={selectClass}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">— No project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="ev-notes">Notes</Label>
            <textarea
              id="ev-notes"
              className={cn(selectClass, "resize-none")}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
