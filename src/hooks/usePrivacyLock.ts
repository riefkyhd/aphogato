"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserPreferencesContext } from "@/components/preferences/UserPreferencesProvider";
import {
  clearSessionUnlock,
  readSessionUnlock,
  writeSessionUnlock,
} from "@/lib/privacy/session";

type PrivacySettings = { pinEnabled: boolean };

export function usePrivacyLock(initialPinEnabled?: boolean) {
  const { preferences, loaded: prefsLoaded, updatePreferences } =
    useUserPreferencesContext();
  const hasInitialPin = initialPinEnabled !== undefined;
  const [pinEnabled, setPinEnabled] = useState(initialPinEnabled ?? false);
  const [settingsLoaded, setSettingsLoaded] = useState(hasInitialPin);
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [moneyVisible, setMoneyVisible] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinModalTitle, setPinModalTitle] = useState("Enter PIN");
  const [pinModalDescription, setPinModalDescription] = useState(
    "Enter your privacy PIN to continue."
  );

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/privacy");
      const json = (await res.json()) as PrivacySettings & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load privacy settings");
      setPinEnabled(Boolean(json.pinEnabled));
    } catch {
      setPinEnabled(false);
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    setSessionUnlocked(readSessionUnlock());
    if (!hasInitialPin) {
      void refreshSettings();
    }
  }, [hasInitialPin, refreshSettings]);

  useEffect(() => {
    if (prefsLoaded) {
      setMoneyVisible(preferences.moneyVisibleByDefault);
    }
  }, [prefsLoaded, preferences.moneyVisibleByDefault]);

  useEffect(() => {
    if (!pinEnabled) return;
    const id = window.setInterval(() => {
      const valid = readSessionUnlock();
      setSessionUnlocked(valid);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [pinEnabled]);

  const isLocked = pinEnabled && !sessionUnlocked;

  const closePinModal = useCallback(() => {
    if (verifying) return;
    setPinModalOpen(false);
    setPinError(null);
    setPendingAction(null);
  }, [verifying]);

  const verifyPin = useCallback(async (pin: string) => {
    setVerifying(true);
    setPinError(null);
    try {
      const res = await fetch("/api/settings/privacy/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setPinError(json.error ?? "Incorrect PIN");
        return false;
      }
      writeSessionUnlock();
      setSessionUnlocked(true);
      setPinModalOpen(false);
      setPinError(null);
      return true;
    } catch {
      setPinError("Failed to verify PIN");
      return false;
    } finally {
      setVerifying(false);
    }
  }, []);

  const requestUnlock = useCallback(
    (opts?: { title?: string; description?: string }) => {
      setPinModalTitle(opts?.title ?? "Unlock finance");
      setPinModalDescription(
        opts?.description ??
          "Enter your privacy PIN to view finance and perform sensitive actions."
      );
      setPinError(null);
      setPendingAction(null);
      setPinModalOpen(true);
    },
    []
  );

  const handlePinSubmit = useCallback(
    async (pin: string) => {
      const ok = await verifyPin(pin);
      if (ok && pendingAction) {
        const action = pendingAction;
        setPendingAction(null);
        action();
      }
    },
    [verifyPin, pendingAction]
  );

  const guardSensitiveAction = useCallback(
    (
      action: () => void,
      opts?: { title?: string; description?: string }
    ) => {
      if (!pinEnabled || sessionUnlocked) {
        action();
        return;
      }
      setPinModalTitle(opts?.title ?? "Confirm with PIN");
      setPinModalDescription(
        opts?.description ?? "Enter your privacy PIN to continue with this action."
      );
      setPinError(null);
      setPendingAction(() => action);
      setPinModalOpen(true);
    },
    [pinEnabled, sessionUnlocked]
  );

  const toggleMoneyVisible = useCallback(() => {
    setMoneyVisible((prev) => {
      const next = !prev;
      void updatePreferences({ moneyVisibleByDefault: next });
      return next;
    });
  }, [updatePreferences]);

  const lockSession = useCallback(() => {
    clearSessionUnlock();
    setSessionUnlocked(false);
  }, []);

  return useMemo(
    () => ({
      pinEnabled,
      settingsLoaded,
      isLocked,
      sessionUnlocked,
      moneyVisible,
      pinModalOpen,
      pinError,
      verifying,
      pinModalTitle,
      pinModalDescription,
      refreshSettings,
      requestUnlock,
      closePinModal,
      handlePinSubmit,
      guardSensitiveAction,
      toggleMoneyVisible,
      lockSession,
    }),
    [
      pinEnabled,
      settingsLoaded,
      isLocked,
      sessionUnlocked,
      moneyVisible,
      pinModalOpen,
      pinError,
      verifying,
      pinModalTitle,
      pinModalDescription,
      refreshSettings,
      requestUnlock,
      closePinModal,
      handlePinSubmit,
      guardSensitiveAction,
      toggleMoneyVisible,
      lockSession,
    ]
  );
}

export type PrivacyLockState = ReturnType<typeof usePrivacyLock>;
