export const PRIVACY_SESSION_KEY = "aphogato_privacy_unlock";
export const MONEY_VISIBLE_KEY = "aphogato_money_visible";
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

type SessionPayload = { unlockedAt: number };

export function readSessionUnlock(): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(PRIVACY_SESSION_KEY);
  if (!raw) return false;
  try {
    const { unlockedAt } = JSON.parse(raw) as SessionPayload;
    if (typeof unlockedAt !== "number") return false;
    if (Date.now() - unlockedAt >= SESSION_TIMEOUT_MS) {
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

export function readMoneyVisible(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(MONEY_VISIBLE_KEY);
  if (raw === null) return false;
  return raw === "1";
}

export function writeMoneyVisible(visible: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MONEY_VISIBLE_KEY, visible ? "1" : "0");
}
