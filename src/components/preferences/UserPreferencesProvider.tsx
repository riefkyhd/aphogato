"use client";

import { createContext, useContext } from "react";
import {
  useUserPreferences,
  type UserPreferencesState,
} from "@/hooks/useUserPreferences";

const UserPreferencesContext = createContext<UserPreferencesState | null>(null);

export function UserPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefs = useUserPreferences();

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
