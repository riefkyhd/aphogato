import { DEFAULT_CURRENCY } from "@/lib/finance/constants";

export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY
): string {
  const code = currency || DEFAULT_CURRENCY;
  if (code === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Parse user input like "1.500.000" or "1500000" to number. */
export function parseMoneyInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/[^\d.,]/g, "").replace(/,/g, ".");
  const parts = normalized.split(".");
  let numeric: string;
  if (parts.length > 1) {
    const dec = parts.pop()!;
    numeric = parts.join("") + "." + dec;
  } else {
    numeric = parts.join("");
  }
  const n = Number(numeric);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
