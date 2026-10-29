import "server-only";
import {
  addMinutesToTime,
  parseTimeToMinutes,
} from "@/lib/calendar/calendarHelpers";
import {
  getGoogleRefreshToken,
  storeGoogleRefreshToken,
} from "@/lib/calendar/googleSettings";
import { isGoogleOAuthConfigured } from "@/lib/calendar/googleOAuthConfig";
import type { CalendarEvent } from "@/lib/types";

const CALENDAR_TIMEZONE = "Asia/Jakarta";
const DEFAULT_DURATION_MINUTES = 120;

const OAUTH_NOT_CONFIGURED_MESSAGE =
  "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment.";

function getGoogleClientCredentials() {
  if (!isGoogleOAuthConfigured()) {
    throw new Error(OAUTH_NOT_CONFIGURED_MESSAGE);
  }
  return {
    clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
  };
}

function resolveRedirectUri(override?: string): string {
  const redirectUri = override?.trim() || process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!redirectUri) {
    throw new Error(OAUTH_NOT_CONFIGURED_MESSAGE);
  }
  return redirectUri;
}

export async function getAccessToken(): Promise<string> {
  const refreshToken = await getGoogleRefreshToken();
  if (!refreshToken) {
    throw new Error("Google Calendar not connected");
  }

  const { clientId, clientSecret } = getGoogleClientCredentials();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const json = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !json.access_token) {
    if (json.error === "invalid_grant") {
      throw new Error(
        "Google Calendar access expired. Disconnect and reconnect in Settings."
      );
    }
    throw new Error(
      json.error_description ?? json.error ?? "Failed to refresh Google token"
    );
  }

  return json.access_token;
}

export function buildEventPayload(event: CalendarEvent) {
  const [year, month, day] = event.shoot_date.split("-").map(Number);
  const [hours = 9, minutes = 0] = (event.shoot_time ?? "09:00")
    .split(":")
    .map(Number);

  const startTime = event.shoot_time ?? "09:00";
  const startLocal = new Date(year, month - 1, day, hours, minutes, 0, 0);
  let endTimeStr = event.shoot_end_time;
  if (endTimeStr) {
    const startMins = parseTimeToMinutes(startTime) ?? 0;
    const endMins = parseTimeToMinutes(endTimeStr) ?? 0;
    if (endMins <= startMins) {
      endTimeStr = addMinutesToTime(startTime, DEFAULT_DURATION_MINUTES);
    }
  } else {
    endTimeStr = addMinutesToTime(startTime, DEFAULT_DURATION_MINUTES);
  }
  const [endH, endM] = endTimeStr.split(":").map(Number);
  const endLocal = new Date(year, month - 1, day, endH, endM, 0, 0);

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

  const descriptionParts: string[] = [];
  if (event.client_name) descriptionParts.push(`Client: ${event.client_name}`);
  if (event.notes) descriptionParts.push(event.notes);
  if (event.status) descriptionParts.push(`Status: ${event.status}`);

  return {
    summary: event.title,
    description: descriptionParts.join("\n\n") || undefined,
    location: event.location ?? undefined,
    start: {
      dateTime: fmt(startLocal),
      timeZone: CALENDAR_TIMEZONE,
    },
    end: {
      dateTime: fmt(endLocal),
      timeZone: CALENDAR_TIMEZONE,
    },
  };
}

export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEvent
): Promise<string> {
  const payload = buildEventPayload(event);
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const json = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message ?? "Failed to create Google event");
  }
  return json.id;
}

export async function updateCalendarEvent(
  accessToken: string,
  googleEventId: string,
  event: CalendarEvent
): Promise<string> {
  const payload = buildEventPayload(event);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const json = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || !json.id) {
    const err = new Error(json.error?.message ?? "Failed to update Google event");
    if (res.status === 404 || res.status === 410) {
      (err as Error & { code?: string }).code = "GOOGLE_EVENT_NOT_FOUND";
    }
    throw err;
  }
  return json.id;
}

function isStaleGoogleEventError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const coded = err as Error & { code?: string };
  if (coded.code === "GOOGLE_EVENT_NOT_FOUND") return true;
  const msg = err.message.toLowerCase();
  return msg.includes("not found") || msg.includes("deleted");
}

export async function deleteCalendarEvent(
  accessToken: string,
  googleEventId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (res.status === 404 || res.status === 410) return;

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(
      json.error?.message ?? "Failed to delete event from Google Calendar"
    );
  }
}

/** Removes the linked Google event when connected. No-op if never synced or not connected. */
export async function deleteEventFromGoogle(
  googleEventId: string | null
): Promise<void> {
  if (!googleEventId) return;

  const refreshToken = await getGoogleRefreshToken();
  if (!refreshToken) return;

  const accessToken = await getAccessToken();
  await deleteCalendarEvent(accessToken, googleEventId);
}

export async function syncEventToGoogle(
  event: CalendarEvent
): Promise<{ google_event_id: string }> {
  const accessToken = await getAccessToken();

  if (event.google_event_id) {
    try {
      const googleEventId = await updateCalendarEvent(
        accessToken,
        event.google_event_id,
        event
      );
      return { google_event_id: googleEventId };
    } catch (err) {
      if (!isStaleGoogleEventError(err)) throw err;
      const googleEventId = await createCalendarEvent(accessToken, event);
      return { google_event_id: googleEventId };
    }
  }

  const googleEventId = await createCalendarEvent(accessToken, event);
  return { google_event_id: googleEventId };
}

export function getGoogleAuthUrl(state: string, redirectUri: string): string {
  const { clientId } = getGoogleClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/drive",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForRefreshToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const { clientId, clientSecret } = getGoogleClientCredentials();
  const resolvedRedirectUri = resolveRedirectUri(redirectUri);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: resolvedRedirectUri,
      grant_type: "authorization_code",
    }),
  });

  const json = (await res.json()) as {
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !json.refresh_token) {
    throw new Error(
      json.error_description ??
        json.error ??
        "No refresh token received — try disconnecting and reconnecting with consent"
    );
  }

  return json.refresh_token;
}

export async function storeRefreshToken(refreshToken: string): Promise<void> {
  await storeGoogleRefreshToken(refreshToken);
}
