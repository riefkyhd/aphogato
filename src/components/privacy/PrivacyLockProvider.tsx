"use client";

import { createContext, useContext } from "react";
import { PinModal } from "@/components/privacy/PinModal";
import {
  usePrivacyLock,
  type PrivacyLockState,
} from "@/hooks/usePrivacyLock";

const PrivacyLockContext = createContext<PrivacyLockState | null>(null);

export function PrivacyLockProvider({ children }: { children: React.ReactNode }) {
  const privacy = usePrivacyLock();

  return (
    <PrivacyLockContext.Provider value={privacy}>
      {children}
      <PinModal
        open={privacy.pinModalOpen}
        title={privacy.pinModalTitle}
        description={privacy.pinModalDescription}
        error={privacy.pinError}
        loading={privacy.verifying}
        onClose={privacy.closePinModal}
        onSubmit={privacy.handlePinSubmit}
      />
    </PrivacyLockContext.Provider>
  );
}

export function usePrivacyLockContext(): PrivacyLockState {
  const ctx = useContext(PrivacyLockContext);
  if (!ctx) {
    throw new Error("usePrivacyLockContext must be used within PrivacyLockProvider");
  }
  return ctx;
}
