"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setPreferencesCache } from "@/lib/preferences/cache";
import { DEFAULT_USER_PREFERENCES } from "@/lib/preferences/defaults";
import {
  clearLegacyLocalStoragePrefs,
  readLegacyLocalStoragePrefs,
} from "@/lib/preferences/migrateLocalStorage";
import type {
  UserPreferences,
  UserPreferencesPatch,
} from "@/lib/preferences/types";

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_USER_PREFERENCES
  );
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const migratedRef = useRef(false);

  const applyPreferences = useCallback((next: UserPreferences) => {
    setPreferences(next);
    setPreferencesCache(next);
  }, []);

  const refreshPreferences = useCallback(async () => {
    const res = await fetch("/api/settings/preferences");
    const json = (await res.json()) as {
      preferences?: UserPreferences;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(json.error ?? "Failed to load preferences");
    }
    const next = json.preferences ?? DEFAULT_USER_PREFERENCES;
    applyPreferences(next);
    return next;
  }, [applyPreferences]);

  const updatePreferences = useCallback(
    async (patch: UserPreferencesPatch) => {
      setSaving(true);
      try {
        const res = await fetch("/api/settings/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const json = (await res.json()) as {
          preferences?: UserPreferences;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to save preferences");
        }
        const next = json.preferences ?? DEFAULT_USER_PREFERENCES;
        applyPreferences(next);
        return next;
      } finally {
        setSaving(false);
      }
    },
    [applyPreferences]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await refreshPreferences();

        if (!migratedRef.current) {
          migratedRef.current = true;
          const legacy = readLegacyLocalStoragePrefs();
          if (legacy) {
            const res = await fetch("/api/settings/preferences", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(legacy),
            });
            const json = (await res.json()) as {
              preferences?: UserPreferences;
            };
            if (res.ok && json.preferences && !cancelled) {
              applyPreferences(json.preferences);
            }
            clearLegacyLocalStoragePrefs();
          }
        }
      } catch {
        if (!cancelled) {
          applyPreferences(DEFAULT_USER_PREFERENCES);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [applyPreferences, refreshPreferences]);

  return useMemo(
    () => ({
      preferences,
      loaded,
      saving,
      refreshPreferences,
      updatePreferences,
    }),
    [preferences, loaded, saving, refreshPreferences, updatePreferences]
  );
}

export type UserPreferencesState = ReturnType<typeof useUserPreferences>;
