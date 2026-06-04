import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

const CALENDAR_TIMEZONE = "Asia/Jakarta";
const DEFAULT_DURATION_HOURS = 2;

const REFRESH_TOKEN_KEY = "google_refresh_token";

function getGoogleEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth is not configured");
  }
  return { clientId, clientSecret, redirectUri };
}

export async function getStoredRefreshToken(): Promise<string | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", REFRESH_TOKEN_KEY)
    .maybeSingle();
  return data?.value ?? null;
}

export async function getAccessToken(): Promise<string> {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error("Google Calendar not connected");
  }

  const { clientId, clientSecret } = getGoogleEnv();
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

  const startLocal = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const endLocal = new Date(startLocal);
  endLocal.setHours(endLocal.getHours() + DEFAULT_DURATION_HOURS);

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
    throw new Error(json.error?.message ?? "Failed to update Google event");
  }
  return json.id;
}

export async function syncEventToGoogle(
  event: CalendarEvent
): Promise<{ google_event_id: string }> {
  const accessToken = await getAccessToken();
  let googleEventId: string;

  if (event.google_event_id) {
    googleEventId = await updateCalendarEvent(
      accessToken,
      event.google_event_id,
      event
    );
  } else {
    googleEventId = await createCalendarEvent(accessToken, event);
  }

  return { google_event_id: googleEventId };
}

export function getGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleEnv();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForRefreshToken(
  code: string
): Promise<string> {
  const { clientId, clientSecret, redirectUri } = getGoogleEnv();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
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
  const supabase = createServerSupabase();
  const { error } = await supabase.from("settings").upsert({
    key: REFRESH_TOKEN_KEY,
    value: refreshToken,
  });
  if (error) throw new Error(error.message);
}
