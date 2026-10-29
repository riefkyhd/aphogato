"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CalendarClient } from "@/app/dashboard/calendar/CalendarClient";
import { ClientsClient } from "@/app/dashboard/clients/ClientsClient";
import type { CalendarEvent } from "@/lib/types";
import type { CalendarProject } from "@/components/calendar/EventDetailPanel";
import type { ClientBookEntry } from "@/lib/clients/clientBookStats";

export function ScheduleClientsWorkspace({
  initialEvents,
  projects,
  isGoogleConnected,
  isOAuthConfigured,
  initialClients,
}: {
  initialEvents: CalendarEvent[];
  projects: CalendarProject[];
  isGoogleConnected: boolean;
  isOAuthConfigured: boolean;
  initialClients: ClientBookEntry[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "clients" ? "clients" : "calendar";

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-3 border-b border-border bg-bg-secondary/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-light tracking-[0.05em] uppercase">
              Schedule & Clients
            </h1>
            <p className="mt-0.5 text-[12px] text-text-secondary">
              Shoot calendar, Google Calendar sync, and client CRM directory.
            </p>
          </div>
          <SegmentedControl
            value={tab}
            aria-label="Schedule & Clients view"
            options={[
              { value: "calendar", label: "Shoot Calendar" },
              { value: "clients", label: "Client Book" },
            ]}
            onChange={(next) => {
              router.push(
                next === "clients"
                  ? "/dashboard/calendar?tab=clients"
                  : "/dashboard/calendar"
              );
            }}
          />
        </div>
      </div>

      {tab === "calendar" ? (
        <CalendarClient
          initialEvents={initialEvents}
          projects={projects}
          isGoogleConnected={isGoogleConnected}
          isOAuthConfigured={isOAuthConfigured}
        />
      ) : (
        <ClientsClient initialClients={initialClients} />
      )}
    </div>
  );
}
