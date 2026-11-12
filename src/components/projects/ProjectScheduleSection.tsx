"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin } from "lucide-react";
import { ProjectReferencesSection } from "@/components/ProjectReferencesSection";
import { StatusDot } from "@/components/StatusDot";
import { FEATURES } from "@/lib/features";
import type { CalendarEvent, Project } from "@/lib/types";

function formatShootDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "EEEE, d MMMM yyyy");
  } catch {
    return isoDate;
  }
}

export function ProjectScheduleSection({
  project,
  event,
}: {
  project: Project;
  event: CalendarEvent | null;
}) {
  const mapsUrl = event?.location?.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location.trim())}`
    : null;

  return (
    <div className="space-y-6">
      {/* Schedule Banner */}
      <div className="border border-border bg-bg-secondary p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" aria-hidden />
            <h3 className="text-[11px] uppercase tracking-label text-text-muted">
              Shoot Schedule &amp; Venue
            </h3>
          </div>
          {event ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-label text-text-secondary">
                <StatusDot status={event.status === "delivered" ? "delivered" : event.status === "editing" ? "editing" : "pending"} />
                {event.status}
              </span>
              <Link
                href="/dashboard/calendar"
                className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary"
              >
                Calendar →
              </Link>
            </div>
          ) : null}
        </div>

        {event ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] text-text-muted">Date</span>
              <p className="text-[14px] text-text-primary font-medium mt-0.5">
                {formatShootDate(event.shoot_date)}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-text-muted">Time / Duration</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-text-muted" aria-hidden />
                <p className="text-[13px] text-text-primary">
                  {event.shoot_time || "Full Day / Flexible"}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-text-muted">Location / Venue</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-text-muted shrink-0" aria-hidden />
                <p className="text-[13px] text-text-primary truncate">
                  {event.location || "Location to be confirmed"}
                </p>
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase tracking-label text-text-muted hover:text-text-primary underline ml-1 shrink-0"
                  >
                    Maps ↗
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[13px] text-text-primary">
                No calendar shoot scheduled yet.
              </p>
              <p className="text-[12px] text-text-secondary mt-0.5">
                Book a shoot date in your calendar to track venue and sync to Google Calendar.
              </p>
            </div>
            <Link
              href={`/dashboard/calendar?new=1&title=${encodeURIComponent(project.name)}&client=${encodeURIComponent(project.client_name ?? "")}`}
              className="btn-secondary !text-[11px] !min-h-[44px] sm:!min-h-9 !px-3 !py-2 inline-flex items-center gap-1.5 uppercase tracking-label shrink-0"
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Add to Calendar
            </Link>
          </div>
        )}
      </div>

      {/* Moodboard & Project References */}
      {FEATURES.projectReferences ? (
        <div className="border border-border bg-bg-secondary p-4 sm:p-5">
          <ProjectReferencesSection
            projectId={project.id}
            projectName={project.name}
            clientName={project.client_name}
          />
        </div>
      ) : null}
    </div>
  );
}
