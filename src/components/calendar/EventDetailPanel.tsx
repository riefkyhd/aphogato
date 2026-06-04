"use client";

import { format, parseISO } from "date-fns";
import { formatSyncedAgo } from "@/lib/calendar/parseSyncedAt";
import { X } from "lucide-react";
import Link from "next/link";
import { EventStatusDot } from "@/components/calendar/EventStatusDot";
import { ShootTypeBadge } from "@/components/calendar/ShootTypeBadge";
import { Button } from "@/components/ui/Button";
import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export type CalendarProject = { id: string; name: string };

export function EventDetailPanel({
  event,
  projects,
  isGoogleConnected,
  open,
  onEdit,
  onDelete,
  onClose,
}: {
  event: CalendarEvent | null;
  projects: CalendarProject[];
  isGoogleConnected: boolean;
  open: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
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
          "transform transition-transform duration-300 ease-out",
          open && event ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!open || !event}
      >
        {event && (
          <div className="flex h-full flex-col p-4 sm:p-6 overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h2 className="text-base sm:text-lg font-light tracking-[0.05em] uppercase text-text-primary pr-2">
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
        )}
      </aside>
    </>
  );
}
