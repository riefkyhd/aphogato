import "server-only";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { logServerError } from "@/lib/api/logError";

function isAuthError(error: PostgrestError): boolean {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    message.includes("jwt") ||
    message.includes("session") ||
    message.includes("not authenticated") ||
    code === "pgrst301"
  );
}

/**
 * Unwrap a Supabase query result and throw on error so it surfaces to
 * the nearest React `error.tsx` boundary. Auth/JWT failures redirect to
 * login instead of rendering a dead-end error page (e.g. clock skew
 * "JWT issued at future").
 */
export function unwrapQuery<T>(
  label: string,
  res: { data: T | null; error: PostgrestError | null }
): T {
  if (res.error) {
    logServerError(label, res.error);
    if (isAuthError(res.error)) {
      redirect("/login");
    }
    throw new Error(`[${label}] ${res.error.message}`);
  }
  return (res.data ?? []) as unknown as T;
}
