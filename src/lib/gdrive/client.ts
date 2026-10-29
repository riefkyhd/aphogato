import "server-only";

import { getGoogleRefreshToken } from "@/lib/calendar/googleSettings";
import { isGoogleOAuthConfigured } from "@/lib/calendar/googleOAuthConfig";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let tokenRefreshPromise: Promise<string> | null = null;

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

/**
 * Returns an active Google OAuth access token with automatic in-memory caching
 * (50 minutes) and shared in-flight promise deduplication to prevent 429 rate limits.
 */
export async function getGDriveAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      const refreshToken = await getGoogleRefreshToken();
      if (!refreshToken) {
        throw new Error(
          "Google account not connected. Connect in Settings to enable Google Drive."
        );
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
        expires_in?: number;
        error?: string;
        error_description?: string;
      };

      if (!res.ok || !json.access_token) {
        if (json.error === "invalid_grant") {
          throw new Error(
            "Google Drive access expired. Disconnect and reconnect in Settings."
          );
        }
        throw new Error(
          json.error_description ?? json.error ?? "Failed to refresh Google token"
        );
      }

      cachedToken = json.access_token;
      // Refresh 5 minutes before actual expiry (default 3600s -> cache for ~3000s)
      const expiresInMs = (json.expires_in ?? 3600) * 1000;
      tokenExpiresAt = Date.now() + Math.max(60_000, expiresInMs - 300_000);

      return json.access_token;
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
}

/** Parses raw Google Drive folder ID or full sharing / web URL. */
export function parseDriveFolderId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Check URL formats: /folders/<id> or id=<id>
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch?.[1]) return idParamMatch[1];

  // Raw alphanumeric/dash ID
  const clean = trimmed.split("?")[0].replace(/\/+$/, "");
  const parts = clean.split("/");
  return parts[parts.length - 1];
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  imageMediaMetadata?: {
    time?: string;
    width?: number;
    height?: number;
  };
}

/** List all image files inside a Google Drive folder. */
export async function listDriveFolderFiles(
  folderId: string
): Promise<DriveFileItem[]> {
  const token = await getGDriveAccessToken();
  const cleanFolderId = parseDriveFolderId(folderId);
  const items: DriveFileItem[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${cleanFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, size, thumbnailLink, imageMediaMetadata)",
      pageSize: "100",
      orderBy: "name asc",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Drive list failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as {
      nextPageToken?: string;
      files?: DriveFileItem[];
    };
    if (data.files) {
      items.push(...data.files);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

/** Get metadata of a single Google Drive file. */
export async function getDriveFileMeta(
  fileId: string
): Promise<DriveFileItem | null> {
  const token = await getGDriveAccessToken();
  const params = new URLSearchParams({
    fields: "id, name, mimeType, size, thumbnailLink, imageMediaMetadata",
    supportsAllDrives: "true",
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    if (res.status === 404) return null;
    const text = await res.text();
    throw new Error(`Failed to fetch Google Drive file info (${res.status}): ${text}`);
  }

  return (await res.json()) as DriveFileItem;
}

/** Initiates a Google Drive Resumable Upload session for browser direct uploading. */
export async function createDriveResumableUploadSession(
  folderId: string,
  filename: string,
  mimeType: string,
  origin?: string
): Promise<{ uploadUrl: string }> {
  const token = await getGDriveAccessToken();
  const cleanFolderId = parseDriveFolderId(folderId);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=UTF-8",
    "X-Upload-Content-Type": mimeType,
  };
  if (origin) {
    headers["Origin"] = origin;
  }

  const metadata = {
    name: filename,
    parents: [cleanFolderId],
  };

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
    {
      method: "POST",
      headers,
      body: JSON.stringify(metadata),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to initiate Drive upload (${res.status}): ${text}`);
  }

  const uploadUrl = res.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("Google Drive did not return a resumable upload location header");
  }

  return { uploadUrl };
}

/** Soft-deletes / trashes a file in Google Drive. */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getGDriveAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.status === 404) return;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive delete failed (${res.status}): ${text}`);
  }
}
