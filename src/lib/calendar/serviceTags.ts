export const AVAILABLE_SERVICES = ["photography", "videography"] as const;
export type KnownService = (typeof AVAILABLE_SERVICES)[number];

export const SERVICE_TAG_LABELS: Record<string, string> = {
  photography: "Photography",
  videography: "Videography",
};

export const DEFAULT_SERVICES: string[] = ["photography"];

/**
 * Normalizes any unknown input into a clean string array of services.
 * Defaults to ["photography"] if none or empty.
 */
export function normalizeServices(services: unknown): string[] {
  if (Array.isArray(services)) {
    const cleaned = services
      .map((s) => (typeof s === "string" ? s.trim().toLowerCase() : ""))
      .filter(Boolean);
    if (cleaned.length > 0) {
      // Return deduplicated array preserving order
      return Array.from(new Set(cleaned));
    }
  } else if (typeof services === "string" && services.trim()) {
    return [services.trim().toLowerCase()];
  }
  return [...DEFAULT_SERVICES];
}

export const PAYMENT_STATUS_VALUES = [
  "unpaid",
  "deposit_paid",
  "paid_in_full",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  deposit_paid: "DP Paid",
  paid_in_full: "Paid Full",
};

export function isPaymentStatus(val: unknown): val is PaymentStatus {
  return (
    typeof val === "string" &&
    (PAYMENT_STATUS_VALUES as readonly string[]).includes(val)
  );
}

export function normalizePaymentStatus(status: unknown): PaymentStatus {
  if (isPaymentStatus(status)) {
    return status;
  }
  return "unpaid";
}

/**
 * Cycles to the next logical payment status in sequence:
 * Unpaid -> DP Paid -> Paid Full -> (wraps to Unpaid)
 */
export function nextPaymentStatus(current: PaymentStatus): PaymentStatus {
  switch (current) {
    case "unpaid":
      return "deposit_paid";
    case "deposit_paid":
      return "paid_in_full";
    case "paid_in_full":
      return "unpaid";
    default:
      return "deposit_paid";
  }
}
