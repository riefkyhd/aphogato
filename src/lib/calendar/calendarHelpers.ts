import type { ShootType, EventStatus } from "@/lib/types";

export const SHOOT_TYPE_COLORS: Record<ShootType, string> = {
  wedding: "#7c3aed",
  portrait: "#b8860b",
  event: "#2563eb",
  commercial: "#2e7d32",
  other: "#555555",
};

export const SHOOT_TYPE_LABELS: Record<ShootType, string> = {
  wedding: "Wedding",
  portrait: "Portrait",
  event: "Event",
  commercial: "Commercial",
  other: "Other",
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  scheduled: "#2563eb",
  shot: "#7c3aed",
  editing: "#b8860b",
  delivered: "#2e7d32",
};

export const SHOOT_TYPES: ShootType[] = [
  "wedding",
  "portrait",
  "event",
  "commercial",
  "other",
];
export const EVENT_STATUSES: EventStatus[] = [
  "scheduled",
  "shot",
  "editing",
  "delivered",
];

export function isShootType(value: string): value is ShootType {
  return (SHOOT_TYPES as string[]).includes(value);
}

export function isEventStatus(value: string): value is EventStatus {
  return (EVENT_STATUSES as string[]).includes(value);
}
