/** Allow only same-origin relative paths after login (blocks open redirects). */
export function sanitizeNextPath(next: string | null | undefined): string {
  const fallback = "/dashboard";
  if (!next || typeof next !== "string") return fallback;

  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;

  try {
    const path = new URL(trimmed, "http://local");
    if (path.origin !== "http://local") return fallback;
    if (!path.pathname.startsWith("/dashboard")) return fallback;
    return `${path.pathname}${path.search}${path.hash}`;
  } catch {
    return fallback;
  }
}
