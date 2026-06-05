"use client";

import { formatMoney } from "@/lib/finance/formatMoney";
import { cn } from "@/lib/utils";

const MASK = "••••••";

export function MaskedMoney({
  amount,
  visible,
  className,
}: {
  amount: number;
  visible: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("tabular-nums", !visible && "select-none", className)}
      aria-hidden={!visible}
    >
      {visible ? formatMoney(amount) : MASK}
    </span>
  );
}

export function MaskedMoneyText({
  text,
  visible,
  className,
}: {
  text: string;
  visible: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("tabular-nums", !visible && "select-none", className)}
      aria-hidden={!visible}
    >
      {visible ? text : MASK}
    </span>
  );
}
