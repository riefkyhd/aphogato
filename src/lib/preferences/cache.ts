import { DEFAULT_USER_PREFERENCES } from "@/lib/preferences/defaults";
import type { UserPreferences } from "@/lib/preferences/types";

let cache: UserPreferences = DEFAULT_USER_PREFERENCES;

export function getPreferencesCache(): UserPreferences {
  return cache;
}

export function setPreferencesCache(prefs: UserPreferences): void {
  cache = prefs;
}

export function getPinSessionTimeoutMs(): number {
  return getPreferencesCache().pinSessionTimeoutMinutes * 60 * 1000;
}
