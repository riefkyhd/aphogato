import "server-only";

import type { Client } from "@/lib/types";

export type ClientBookEntry = Client & {
  projectCount: number;
  lastEventDate: string | null;
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function attachClientBookStats(
  clients: Client[],
  projects: { client_name: string | null }[],
  events: { client_name: string | null; shoot_date: string }[]
): ClientBookEntry[] {
  const projectCounts = new Map<string, number>();
  for (const project of projects) {
    const key = project.client_name?.trim();
    if (!key) continue;
    const normalized = normalizeName(key);
    projectCounts.set(normalized, (projectCounts.get(normalized) ?? 0) + 1);
  }

  const lastEventDates = new Map<string, string>();
  for (const event of events) {
    const key = event.client_name?.trim();
    if (!key || !event.shoot_date) continue;
    const normalized = normalizeName(key);
    const existing = lastEventDates.get(normalized);
    if (!existing || event.shoot_date > existing) {
      lastEventDates.set(normalized, event.shoot_date);
    }
  }

  return clients.map((client) => {
    const normalized = normalizeName(client.name);
    return {
      ...client,
      projectCount: projectCounts.get(normalized) ?? 0,
      lastEventDate: lastEventDates.get(normalized) ?? null,
    };
  });
}
