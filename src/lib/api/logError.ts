import "server-only";

/**
 * Central server-side error logger. Today this only logs to the server
 * console (which Vercel already captures). Wire Sentry / a log drain here
 * later without touching every call site.
 */
export function logServerError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  const err =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { value: error };
  console.error(`[server:${context}]`, {
    ...err,
    ...(extra ?? {}),
  });
}

type JsonInit = ResponseInit & { headers?: HeadersInit };

/**
 * Wrap an API route handler with a try/catch, log any uncaught error, and
 * return a 500 JSON response. Prefer this over ad-hoc try/catch across API
 * routes so we can bolt on Sentry-style reporting in one place later.
 */
export function withErrorHandler<Args extends unknown[]>(
  context: string,
  handler: (...args: Args) => Response | Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      logServerError(context, error);
      return jsonError(500, "Internal server error");
    }
  };
}

export function jsonError(status: number, message: string, init?: JsonInit) {
  return new Response(JSON.stringify({ error: message }), {
    ...init,
    status,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}
