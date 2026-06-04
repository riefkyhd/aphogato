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

export const DURATION_PRESETS = [
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
  { label: "8h", minutes: 480 },
] as const;

export function parseTimeToMinutes(time: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function minutesToTime(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const min = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const start = parseTimeToMinutes(time);
  if (start == null) return time;
  return minutesToTime(start + minutes);
}

export function formatEventTimeRange(
  shootTime: string | null,
  shootEndTime: string | null
): string {
  if (!shootTime && !shootEndTime) return "";
  if (shootTime && shootEndTime) return `${shootTime} – ${shootEndTime}`;
  if (shootTime) return shootTime;
  return shootEndTime ?? "";
}

export function validateTimeRange(
  shootTime: string | null,
  shootEndTime: string | null
): string | null {
  if (!shootTime || !shootEndTime) return null;
  const start = parseTimeToMinutes(shootTime);
  const end = parseTimeToMinutes(shootEndTime);
  if (start == null || end == null) return "Invalid time format";
  if (end <= start) return "End time must be after start time";
  return null;
}
