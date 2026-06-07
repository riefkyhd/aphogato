import type { QuotationLineItem } from "@/lib/quotations/types";

export function lineItemTotal(item: QuotationLineItem): number {
  const qty = Number.isFinite(item.qty) && item.qty > 0 ? item.qty : 0;
  const price =
    Number.isFinite(item.unitPrice) && item.unitPrice >= 0 ? item.unitPrice : 0;
  return qty * price;
}

export function quotationSubtotal(items: QuotationLineItem[]): number {
  return items.reduce((sum, item) => sum + lineItemTotal(item), 0);
}

export function quotationDownPayment(items: QuotationLineItem[]): number {
  return Math.round(quotationSubtotal(items) * 0.5);
}
