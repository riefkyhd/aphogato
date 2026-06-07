import {
  quotationDownPayment,
  quotationSubtotal,
} from "@/lib/quotations/calculations";
import type { QuotationLineItem } from "@/lib/quotations/types";

export const QUOTATION_BANK_ACCOUNTS = [
  {
    bank: "BCA",
    name: "Muhammad Riefky Hadid",
    number: "7151660138",
  },
  {
    bank: "Mandiri",
    name: "Muhammad Riefky Hadid",
    number: "1570005080263",
  },
] as const;

export function quotationBalance(items: QuotationLineItem[]): number {
  const total = quotationSubtotal(items);
  return total - quotationDownPayment(items);
}
