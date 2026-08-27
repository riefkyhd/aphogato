import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Unwrap a Supabase query result and throw on error so it surfaces to
 * the nearest React `error.tsx` boundary. Server-page loaders should
 * prefer this over `res.data ?? []` which silently swallows failures.
 */
export function unwrapQuery<T>(
  label: string,
  res: { data: T | null; error: PostgrestError | null }
): T {
  if (res.error) {
    throw new Error(`[${label}] ${res.error.message}`);
  }
  return (res.data ?? []) as unknown as T;
}
