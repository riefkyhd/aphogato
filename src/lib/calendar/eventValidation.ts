import {
  EVENT_STATUSES,
  isEventStatus,
  isShootType,
  SHOOT_TYPES,
} from "@/lib/calendar/calendarHelpers";
import type { CalendarEvent, EventStatus, ShootType } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseEventInsertBody(body: Record<string, unknown>): {
  data?: Omit<
    CalendarEvent,
    "id" | "google_event_id" | "synced_at" | "created_at"
  >;
  error?: string;
} {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return { error: "title is required" };

  const shoot_date =
    typeof body.shoot_date === "string" ? body.shoot_date.trim() : "";
  if (!DATE_RE.test(shoot_date)) {
    return { error: "shoot_date must be YYYY-MM-DD" };
  }

  const shoot_type =
    typeof body.shoot_type === "string" ? body.shoot_type : "other";
  if (!isShootType(shoot_type)) {
    return { error: `shoot_type must be one of ${SHOOT_TYPES.join(", ")}` };
  }

  const status =
    typeof body.status === "string" ? body.status : "scheduled";
  if (!isEventStatus(status)) {
    return { error: `status must be one of ${EVENT_STATUSES.join(", ")}` };
  }

  const shoot_time =
    body.shoot_time == null || body.shoot_time === ""
      ? null
      : typeof body.shoot_time === "string"
        ? body.shoot_time.trim()
        : null;
  if (shoot_time && !TIME_RE.test(shoot_time)) {
    return { error: "shoot_time must be HH:MM" };
  }

  return {
    data: {
      title,
      client_name:
        typeof body.client_name === "string"
          ? body.client_name.trim() || null
          : null,
      shoot_type,
      location:
        typeof body.location === "string"
          ? body.location.trim() || null
          : null,
      shoot_date,
      shoot_time,
      status,
      notes:
        typeof body.notes === "string" ? body.notes.trim() || null : null,
      project_id:
        typeof body.project_id === "string" && body.project_id
          ? body.project_id
          : null,
    },
  };
}

export function parseEventPatchBody(body: Record<string, unknown>): {
  data?: Partial<
    Omit<CalendarEvent, "id" | "google_event_id" | "synced_at" | "created_at">
  >;
  error?: string;
} {
  const data: Partial<
    Omit<CalendarEvent, "id" | "google_event_id" | "synced_at" | "created_at">
  > = {};

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return { error: "title cannot be empty" };
    data.title = title;
  }

  if (body.shoot_date !== undefined) {
    const shoot_date =
      typeof body.shoot_date === "string" ? body.shoot_date.trim() : "";
    if (!DATE_RE.test(shoot_date)) {
      return { error: "shoot_date must be YYYY-MM-DD" };
    }
    data.shoot_date = shoot_date;
  }

  if (body.shoot_type !== undefined) {
    if (
      typeof body.shoot_type !== "string" ||
      !isShootType(body.shoot_type)
    ) {
      return { error: `shoot_type must be one of ${SHOOT_TYPES.join(", ")}` };
    }
    data.shoot_type = body.shoot_type as ShootType;
  }

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !isEventStatus(body.status)) {
      return { error: `status must be one of ${EVENT_STATUSES.join(", ")}` };
    }
    data.status = body.status as EventStatus;
  }

  if (body.shoot_time !== undefined) {
    if (body.shoot_time === null || body.shoot_time === "") {
      data.shoot_time = null;
    } else if (
      typeof body.shoot_time === "string" &&
      TIME_RE.test(body.shoot_time.trim())
    ) {
      data.shoot_time = body.shoot_time.trim();
    } else {
      return { error: "shoot_time must be HH:MM" };
    }
  }

  if (body.client_name !== undefined) {
    data.client_name =
      typeof body.client_name === "string"
        ? body.client_name.trim() || null
        : null;
  }

  if (body.location !== undefined) {
    data.location =
      typeof body.location === "string"
        ? body.location.trim() || null
        : null;
  }

  if (body.notes !== undefined) {
    data.notes =
      typeof body.notes === "string" ? body.notes.trim() || null : null;
  }

  if (body.project_id !== undefined) {
    data.project_id =
      typeof body.project_id === "string" && body.project_id
        ? body.project_id
        : null;
  }

  if (Object.keys(data).length === 0) {
    return { error: "No valid fields to update" };
  }

  return { data };
}
