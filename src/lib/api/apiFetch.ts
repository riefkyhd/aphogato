import { parseJsonResponse } from "@/lib/clients/parseJsonResponse";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type ApiFetchOptions = RequestInit & {
  /** If provided, sent as JSON body with `content-type: application/json`. */
  json?: unknown;
};

/**
 * Fetch a JSON API. Throws `ApiError` on non-2xx with the server's `error`
 * message when present. Prefer this over hand-rolled `res.ok`/`res.json` at
 * call sites — it centralises error shape handling.
 */
export async function apiFetch<T = unknown>(
  url: string,
  init: ApiFetchOptions = {}
): Promise<T> {
  const { json, headers, body, ...rest } = init;
  const finalHeaders = new Headers(headers);
  let finalBody = body;
  if (json !== undefined && finalBody === undefined) {
    if (!finalHeaders.has("content-type")) {
      finalHeaders.set("content-type", "application/json");
    }
    finalBody = JSON.stringify(json);
  }

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  });

  const data = await parseJsonResponse<T & { error?: string }>(res);
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && data.error) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, String(message), data);
  }
  return data as T;
}
