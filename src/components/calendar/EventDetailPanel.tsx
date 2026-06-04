"use client";

import { formatDistanceToNow, format, parseISO } from "date-fns";
import { X } from "lucide-react";
import Link from "next/link";
import { EventStatusDot } from "@/components/calendar/EventStatusDot";
import { ShootTypeBadge } from "@/components/calendar/ShootTypeBadge";
import { Button } from "@/components/ui/Button";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export type CalendarProject = { id: string; name: string };

export function EventDetailPanel({
  event,
  projects,
  isGoogleConnected,
  open,
  syncing,
  onEdit,
  onDelete,
  onClose,
  onSync,
}: {
  event: CalendarEvent | null;
  projects: CalendarProject[];
  isGoogleConnected: boolean;
  open: boolean;
  syncing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onSync: () => void;
}) {
  const linkedProject = event?.project_id
    ? projects.find((p) => p.id === event.project_id)
    : null;

  return (
    <aside
      className={cn(
        "fixed right-0 top-[60px] bottom-0 w-[380px] max-w-full z-40",
        "bg-bg-secondary border-l border-border",
        "transform transition-transform duration-200 ease-out",
        open && event ? "translate-x-0" : "translate-x-full"
      )}
      aria-hidden={!open || !event}
    >
      {event && (
        <div className="flex h-full flex-col p-6 overflow-y-auto">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 className="text-lg font-light tracking-[0.05em] uppercase text-text-primary pr-2">
              {event.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary p-1 shrink-0"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
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
                Date & time
              </dt>
              <dd className="text-text-primary">
                {format(parseISO(event.shoot_date), "EEEE, MMM d, yyyy")}
                {event.shoot_time ? ` · ${event.shoot_time}` : ""}
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

          <div className="border-t border-border pt-4 mt-4 space-y-3">
            <p className="text-[11px] uppercase tracking-label text-text-muted">
              Google Calendar
            </p>
            {!isGoogleConnected ? (
              <p className="text-[12px] text-text-secondary">
                Connect Google Calendar in{" "}
                <Link
                  href="/dashboard/settings"
                  className="text-text-primary hover:underline"
                >
                  Settings
                </Link>
                .
              </p>
            ) : event.google_event_id ? (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-label text-status-delivered">
                  ● Synced
                  {event.synced_at &&
                    ` ${formatDistanceToNow(new Date(event.synced_at), { addSuffix: true })}`}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full !text-[11px]"
                  loading={syncing}
                  onClick={onSync}
                >
                  Re-sync
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-label text-text-muted">
                  ● Not synced
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full !text-[11px]"
                  loading={syncing}
                  onClick={onSync}
                >
                  Sync to Google Calendar
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-6 mt-auto border-t border-border">
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
      )}
    </aside>
  );
}
