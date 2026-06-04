import type { CalendarEvent, Project } from "@/lib/types";

export type FinanceEventOption = Pick<
  CalendarEvent,
  "id" | "title" | "shoot_date" | "client_name" | "project_id"
>;

export type FinanceProjectOption = Pick<Project, "id" | "name">;

export type SaveExpenseAction = "close" | "another";

export function hasLinkedExpenseContext(
  eventId?: string,
  projectId?: string
): boolean {
  return Boolean(eventId || projectId);
}
