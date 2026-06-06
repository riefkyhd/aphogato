"use client";

import { createContext, useContext } from "react";
import {
  useUserPreferences,
  type UserPreferencesState,
} from "@/hooks/useUserPreferences";
import type { UserPreferences } from "@/lib/preferences/types";

const UserPreferencesContext = createContext<UserPreferencesState | null>(null);

export function UserPreferencesProvider({
  children,
  initialPreferences,
}: {
  children: React.ReactNode;
  initialPreferences?: UserPreferences;
}) {
  const prefs = useUserPreferences(initialPreferences);

  return (
    <UserPreferencesContext.Provider value={prefs}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferencesContext(): UserPreferencesState {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useUserPreferencesContext must be used within UserPreferencesProvider"
    );
  }
  return ctx;
}

export function useOptionalUserPreferencesContext(): UserPreferencesState | null {
  return useContext(UserPreferencesContext);
}
