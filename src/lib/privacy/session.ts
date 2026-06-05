import { getPinSessionTimeoutMs } from "@/lib/preferences/cache";

export const PRIVACY_SESSION_KEY = "aphogato_privacy_unlock";
export const MONEY_VISIBLE_KEY = "aphogato_money_visible";

type SessionPayload = { unlockedAt: number };

export function readSessionUnlock(): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(PRIVACY_SESSION_KEY);
  if (!raw) return false;
  try {
    const { unlockedAt } = JSON.parse(raw) as SessionPayload;
    if (typeof unlockedAt !== "number") return false;
    if (Date.now() - unlockedAt >= getPinSessionTimeoutMs()) {
      sessionStorage.removeItem(PRIVACY_SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    sessionStorage.removeItem(PRIVACY_SESSION_KEY);
    return false;
  }
}

export function writeSessionUnlock(): void {
  if (typeof window === "undefined") return;
  const payload: SessionPayload = { unlockedAt: Date.now() };
  sessionStorage.setItem(PRIVACY_SESSION_KEY, JSON.stringify(payload));
}

export function clearSessionUnlock(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PRIVACY_SESSION_KEY);
}

