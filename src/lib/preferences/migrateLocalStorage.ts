import { BROWSER_REMINDER_KEY } from "@/lib/calendar/todayEvents";
import { MONEY_VISIBLE_KEY } from "@/lib/privacy/session";
import type { UserPreferencesPatch } from "@/lib/preferences/types";

/** One-time migration of legacy localStorage keys into user preferences. */
export function readLegacyLocalStoragePrefs(): UserPreferencesPatch | null {
  if (typeof window === "undefined") return null;

  const patch: UserPreferencesPatch = {};
  let hasAny = false;

  const money = localStorage.getItem(MONEY_VISIBLE_KEY);
  if (money !== null) {
    patch.moneyVisibleByDefault = money === "1";
    hasAny = true;
  }

  if (localStorage.getItem(BROWSER_REMINDER_KEY) === "true") {
    patch.browserReminderEnabled = true;
    hasAny = true;
  }

  return hasAny ? patch : null;
}

export function clearLegacyLocalStoragePrefs(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MONEY_VISIBLE_KEY);
  localStorage.removeItem(BROWSER_REMINDER_KEY);
}
