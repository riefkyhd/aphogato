"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, Clock, DollarSign, Loader2 } from "lucide-react";
import {
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
  nextPaymentStatus,
  normalizePaymentStatus,
} from "@/lib/calendar/serviceTags";
import { cn } from "@/lib/utils";

export function PaymentStatusButton({
  status,
  onChange,
  disabled = false,
  className,
}: {
  status?: PaymentStatus | string | null;
  onChange: (next: PaymentStatus) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const current = normalizePaymentStatus(status);
  const next = nextPaymentStatus(current);
  const currentLabel = PAYMENT_STATUS_LABELS[current];
  const nextLabel = PAYMENT_STATUS_LABELS[next];

  const currentStyles = {
    unpaid: "border-border text-text-secondary hover:border-amber-500/40 hover:text-amber-400",
    deposit_paid: "border-amber-500/30 text-amber-400 hover:border-emerald-500/40 hover:text-emerald-400",
    paid_in_full: "border-emerald-500/30 text-emerald-400 hover:border-border hover:text-text-secondary",
  }[current];

  async function handleClick() {
    if (disabled || loading) return;
    setLoading(true);
    try {
      await onChange(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={disabled || loading}
      title={`Current: ${currentLabel}. Click to mark as ${nextLabel}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border bg-bg-surface/80 text-[10px] uppercase tracking-label font-medium transition-all cursor-pointer active:scale-[0.98]",
        currentStyles,
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin text-text-muted" aria-hidden />
      ) : current === "paid_in_full" ? (
        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden />
      ) : current === "deposit_paid" ? (
        <Clock className="h-3 w-3 shrink-0 text-amber-400" aria-hidden />
      ) : (
        <DollarSign className="h-3 w-3 shrink-0 text-text-muted" aria-hidden />
      )}
      <span>{currentLabel}</span>
      <span className="text-text-muted text-[9px] flex items-center ml-0.5">
        <ChevronRight className="h-2.5 w-2.5 shrink-0" aria-hidden />
        {nextLabel}
      </span>
    </button>
  );
}
