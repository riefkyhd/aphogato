"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

/** Client-only mount avoids Sonner `<section>` SSR hydration mismatches. */
export function AppToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Toaster
      theme="dark"
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#141414",
          border: "1px solid #2a2a2a",
          color: "#f0f0f0",
          borderRadius: "2px",
        },
      }}
    />
  );
}
