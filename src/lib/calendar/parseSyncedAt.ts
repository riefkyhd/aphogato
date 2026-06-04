import { formatDistanceToNow, parseISO } from "date-fns";

/** Postgres `timestamp` (no tz) values are stored as UTC — parse accordingly. */
export function parseSyncedAt(value: string): Date {
  const trimmed = value.trim();
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return parseISO(trimmed);
  }
  const normalized = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T");
  return parseISO(`${normalized}Z`);
}

export function formatSyncedAgo(value: string): string {
  return formatDistanceToNow(parseSyncedAt(value), { addSuffix: true });
}
