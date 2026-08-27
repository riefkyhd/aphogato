"use client";

import { ArrowLeft, FileDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BackNavLink } from "@/components/BackNavLink";
import { SalesSectionNav } from "@/components/sales/SalesSectionNav";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { QuotationPageFrame } from "@/components/quotations/QuotationPageFrame";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  PageToolbarActions,
  toolbarButtonClass,
} from "@/components/ui/PageToolbarActions";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatMoney, parseMoneyInput } from "@/lib/finance/formatMoney";
import { createBlankInvoice } from "@/lib/invoices/defaults";
import { exportInvoicePdf } from "@/lib/invoices/exportInvoicePdf";
import { invoiceFromQuotation } from "@/lib/invoices/fromQuotation";
import type { InvoiceDraft } from "@/lib/invoices/types";
import {
  quotationFinalBalance,
  quotationSubtotal,
} from "@/lib/quotations/calculations";
import type { SavedQuotation } from "@/lib/quotations/db";
import { cn } from "@/lib/utils";

function formatListLabel(item: SavedQuotation): string {
  return (
    item.client_name?.trim() ||
    item.project_title?.trim() ||
    item.quote_number
  );
}

export function InvoiceClient({
  initialSavedQuotations,
}: {
  initialSavedQuotations: SavedQuotation[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from");

  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(
    null
  );
  const [draft, setDraft] = useState<InvoiceDraft>(() => createBlankInvoice());
  const [exporting, setExporting] = useState(false);
  const pdfExportRef = useRef<HTMLElement>(null);

  const selectedQuotation = useMemo(
    () =>
      initialSavedQuotations.find((item) => item.id === selectedQuotationId) ??
      null,
    [initialSavedQuotations, selectedQuotationId]
  );

  const applyQuotation = useCallback((quote: SavedQuotation) => {
    setSelectedQuotationId(quote.id);
    setDraft(invoiceFromQuotation(quote));
  }, []);

  useEffect(() => {
    if (!fromId || initialSavedQuotations.length === 0) return;
    const quote = initialSavedQuotations.find((item) => item.id === fromId);
    if (!quote) return;
    applyQuotation(quote);
  }, [applyQuotation, fromId, initialSavedQuotations]);

  const updateDraft = useCallback((patch: Partial<InvoiceDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSelectQuotation = useCallback(
    (quote: SavedQuotation) => {
      applyQuotation(quote);
      router.replace(`/dashboard/invoices?from=${encodeURIComponent(quote.id)}`, {
        scroll: false,
      });
      toast.success(`Loaded ${quote.quote_number}`);
    },
    [applyQuotation, router]
  );

  const handleExportPdf = useCallback(async () => {
    const exportRoot = pdfExportRef.current;
    if (!exportRoot) {
      toast.error("Preview not ready for export");
      return;
    }

    setExporting(true);
    try {
      await exportInvoicePdf(draft, exportRoot);
      toast.success("Invoice PDF downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [draft]);

  const total = quotationSubtotal(draft.lineItems);
  const balanceDue = quotationFinalBalance(draft.lineItems, draft.depositPaid);

  return (
    <DashboardMain>
      <BackNavLink
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Home
      </BackNavLink>

      <SalesSectionNav className="mb-6" />

      <header className="mb-8 border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase">
              Final invoice
            </h1>
            <p className="mt-2 text-[13px] text-text-secondary max-w-2xl">
              Generate the remaining balance invoice after the quotation deposit
              has been received. Pick a saved quotation to prefill client,
              event, and pricing details.
            </p>
          </div>
          <PageToolbarActions>
            <Tooltip label="Download PDF">
              <Button
                type="button"
                size="sm"
                className={toolbarButtonClass}
                loading={exporting}
                disabled={!selectedQuotation}
                onClick={() => void handleExportPdf()}
                aria-label="Export invoice PDF"
              >
                <FileDown className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                PDF
              </Button>
            </Tooltip>
          </PageToolbarActions>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 xl:gap-8 items-start">
        <div className="space-y-6">
          <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[11px] uppercase tracking-label text-text-muted">
                Source quotation
              </h2>
              <span className="text-[11px] text-text-muted tabular-nums">
                {initialSavedQuotations.length} saved
              </span>
            </div>
            {initialSavedQuotations.length === 0 ? (
              <p className="text-[12px] text-text-muted">
                Save a quotation first, then return here to generate the final
                invoice.
              </p>
            ) : (
              <ul className="divide-y divide-border border border-border">
                {initialSavedQuotations.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectQuotation(item)}
                      className={cn(
                        "w-full text-left px-4 py-3 transition-colors hover:bg-bg-primary/40",
                        selectedQuotationId === item.id && "bg-bg-primary/50"
                      )}
                    >
                      <p className="text-[12px] text-text-primary truncate">
                        {item.quote_number}
                      </p>
                      <p className="text-[13px] text-text-secondary mt-0.5 truncate">
                        {formatListLabel(item)}
                      </p>
                      <p className="text-[11px] text-text-muted mt-1">
                        {formatMoney(item.subtotal)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {selectedQuotation ? (
            <>
              <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
                <h2 className="text-[11px] uppercase tracking-label text-text-muted">
                  Invoice details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="invoice-number">Invoice no.</Label>
                    <Input
                      id="invoice-number"
                      value={draft.invoiceNumber}
                      onChange={(event) =>
                        updateDraft({ invoiceNumber: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice-date">Invoice date</Label>
                    <Input
                      id="invoice-date"
                      type="date"
                      value={draft.invoiceDate}
                      onChange={(event) =>
                        updateDraft({ invoiceDate: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="due-date">Due date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={draft.dueDate}
                      onChange={(event) =>
                        updateDraft({ dueDate: event.target.value })
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
                <h2 className="text-[11px] uppercase tracking-label text-text-muted">
                  Payment summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deposit-paid">Deposit paid</Label>
                    <Input
                      id="deposit-paid"
                      inputMode="numeric"
                      value={
                        draft.depositPaid > 0
                          ? String(draft.depositPaid)
                          : ""
                      }
                      onChange={(event) => {
                        const parsed = parseMoneyInput(event.target.value);
                        updateDraft({ depositPaid: parsed ?? 0 });
                      }}
                    />
                    <p className="text-[11px] text-text-muted mt-1">
                      Defaults to 50% of the quotation total.
                    </p>
                  </div>
                  <div>
                    <Label>Balance due</Label>
                    <p className="text-[15px] text-text-primary tabular-nums py-2">
                      {formatMoney(balanceDue)}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Total {formatMoney(total)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
                <h2 className="text-[11px] uppercase tracking-label text-text-muted">
                  Notes & terms
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invoice-notes">Notes</Label>
                    <textarea
                      id="invoice-notes"
                      value={draft.notes}
                      onChange={(event) =>
                        updateDraft({ notes: event.target.value })
                      }
                      rows={3}
                      className="mt-2 w-full rounded-sm border border-border bg-bg-primary px-3 py-2 text-[13px] text-text-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice-terms">Terms</Label>
                    <textarea
                      id="invoice-terms"
                      value={draft.terms}
                      onChange={(event) =>
                        updateDraft({ terms: event.target.value })
                      }
                      rows={5}
                      className="mt-2 w-full rounded-sm border border-border bg-bg-primary px-3 py-2 text-[13px] text-text-primary"
                    />
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>

        <div className="xl:sticky xl:top-6">
          <p className="text-[11px] uppercase tracking-label text-text-muted mb-3">
            Preview
          </p>
          <QuotationPageFrame>
            <InvoicePreview ref={pdfExportRef} draft={draft} />
          </QuotationPageFrame>
        </div>
      </div>
    </DashboardMain>
  );
}
