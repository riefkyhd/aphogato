import type { InvoiceDraft } from "@/lib/invoices/types";
import { clientNameForExport } from "@/lib/quotations/exportFilename";

function sanitizeFilenamePart(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildInvoiceExportFilename(draft: InvoiceDraft): string {
  const invoiceNumber =
    sanitizeFilenamePart(draft.invoiceNumber.trim()) || "invoice";
  const client = clientNameForExport(draft.clientName);
  return `${invoiceNumber}-${client}.pdf`;
}
