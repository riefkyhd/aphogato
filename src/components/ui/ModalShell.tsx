"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { cn } from "@/lib/utils";

const overlayClass =
  "fixed inset-0 flex items-end sm:items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]";

const panelClass =
  "relative w-full max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto border border-border bg-bg-elevated p-5 sm:p-6 shadow-lg";

export function ModalShell({
  open,
  onClose,
  titleId,
  children,
  zClassName = "z-[110]",
  panelClassName,
  maxWidthClassName = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
  zClassName?: string;
  panelClassName?: string;
  maxWidthClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useBodyScrollLock(open);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={cn(overlayClass, zClassName)}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className={cn(panelClass, maxWidthClassName, panelClassName)}>
        {children}
      </div>
    </div>,
    document.body
  );
}
