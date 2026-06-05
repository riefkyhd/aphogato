"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  addMinutesToTime,
  DURATION_PRESETS,
  EVENT_STATUSES,
  SHOOT_TYPE_LABELS,
  SHOOT_TYPES,
  validateTimeRange,
} from "@/lib/calendar/calendarHelpers";
import type { CalendarProject } from "@/components/calendar/EventDetailPanel";
import { ClientNameInput } from "@/components/clients/ClientNameInput";
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
  initialIncomeAmount,
  onSave,
  onClose,
}: {
  open: boolean;
  initialDate?: Date | null;
  event?: CalendarEvent | null;
  projects: CalendarProject[];
  initialIncomeAmount?: string;
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
  const [shootEndTime, setShootEndTime] = useState("");
  const [status, setStatus] = useState<EventStatus>("scheduled");
  const [notes, setNotes] = useState("");
  const [projectId, setProjectId] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setClientName(event.client_name ?? "");
      setShootType(event.shoot_type);
      setLocation(event.location ?? "");
      setShootDate(event.shoot_date);
      setShootTime(event.shoot_time ?? "");
      setShootEndTime(event.shoot_end_time ?? "");
      setStatus(event.status);
      setNotes(event.notes ?? "");
      setProjectId(event.project_id ?? "");
      setIncomeAmount(initialIncomeAmount ?? "");
    } else {
      setTitle("");
      setClientName("");
      setShootType("other");
      setLocation("");
      setShootDate(
        initialDate
          ? format(initialDate, "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd")
      );
      setShootTime("09:00");
      setShootEndTime("11:00");
      setStatus("scheduled");
      setNotes("");
      setProjectId("");
      setIncomeAmount("");
    }
  }, [open, event, initialDate, initialIncomeAmount]);

  const handleStartTimeChange = useCallback(
    (value: string) => {
      setShootTime(value);
      if (value && shootEndTime) {
        const err = validateTimeRange(value, shootEndTime);
        if (err) {
          setShootEndTime(addMinutesToTime(value, 120));
        }
      } else if (value && !shootEndTime) {
        setShootEndTime(addMinutesToTime(value, 120));
      }
    },
    [shootEndTime]
  );

  const applyDuration = useCallback(
    (minutes: number) => {
      if (!shootTime) {
        toast.error("Set a start time first");
        return;
      }
      setShootEndTime(addMinutesToTime(shootTime, minutes));
    },
    [shootTime]
  );

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
    const rangeError = validateTimeRange(
      shootTime || null,
      shootEndTime || null
    );
    if (rangeError) {
      toast.error(rangeError);
      return;
    }
    onSave({
      title,
      client_name: clientName || null,
      shoot_type: shootType,
      location: location || null,
      shoot_date: shootDate,
      shoot_time: shootTime || null,
      shoot_end_time: shootEndTime || null,
      status,
      notes: notes || null,
      project_id: projectId || null,
      income_amount: incomeAmount.trim() || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-start justify-center overflow-y-auto bg-bg-primary/85 backdrop-blur-sm p-0 sm:p-4"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        className="relative w-full max-w-[540px] sm:my-8 bg-bg-elevated border border-border p-4 sm:p-6 max-h-[92vh] overflow-y-auto"
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
          <ClientNameInput
            id="ev-client"
            value={clientName}
            onChange={setClientName}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div>
            <Label htmlFor="ev-date">Date</Label>
            <Input
              id="ev-date"
              type="date"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ev-time">Start time</Label>
              <Input
                id="ev-time"
                type="time"
                value={shootTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ev-end-time">End time</Label>
              <Input
                id="ev-end-time"
                type="time"
                value={shootEndTime}
                onChange={(e) => setShootEndTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-label text-text-muted block mb-2">
              Duration
            </span>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyDuration(p.minutes)}
                  className="px-3 py-1.5 text-[11px] uppercase tracking-label border border-border text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                >
                  {p.label}
                </button>
              ))}
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
            <Label htmlFor="ev-income">Client income (IDR)</Label>
            <Input
              id="ev-income"
              inputMode="numeric"
              placeholder="e.g. 1500000"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Optional. Saved to Finance and linked to this event.
            </p>
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
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
