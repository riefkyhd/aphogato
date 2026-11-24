"use client";

import { CheckCircle2, Clock, DollarSign } from "lucide-react";
import {
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
  normalizePaymentStatus,
} from "@/lib/calendar/serviceTags";
import { cn } from "@/lib/utils";

export function PaymentStatusBadge({
  status,
  className,
  showIcon = true,
  size = "sm",
}: {
  status?: PaymentStatus | string | null;
  className?: string;
  showIcon?: boolean;
  size?: "xs" | "sm" | "md";
}) {
  const norm = normalizePaymentStatus(status);
  const label = PAYMENT_STATUS_LABELS[norm];

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0.5 gap-1",
    sm: "text-[10px] px-2 py-0.5 gap-1.5",
    md: "text-[11px] px-2.5 py-1 gap-1.5",
  }[size];

  const iconSizes = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  }[size];

  const variantStyles = {
    unpaid: "border-border/70 bg-bg-surface/50 text-text-muted",
    deposit_paid: "border-amber-500/30 bg-amber-500/10 text-amber-400 font-medium",
    paid_in_full: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium",
  }[norm];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border uppercase tracking-label select-none",
        sizeClasses,
        variantStyles,
        className
      )}
    >
      {showIcon && (
        norm === "paid_in_full" ? (
          <CheckCircle2 className={cn("shrink-0 text-emerald-400", iconSizes)} aria-hidden />
        ) : norm === "deposit_paid" ? (
          <Clock className={cn("shrink-0 text-amber-400", iconSizes)} aria-hidden />
        ) : (
          <DollarSign className={cn("shrink-0 text-text-muted", iconSizes)} aria-hidden />
        )
      )}
      <span>{label}</span>
    </span>
  );
}
