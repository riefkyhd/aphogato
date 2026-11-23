"use client";

import { ArrowLeft, FileDown, FileText, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BackNavLink } from "@/components/BackNavLink";
import { SalesSectionNav } from "@/components/sales/SalesSectionNav";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { QuotationPageFrame } from "@/components/quotations/QuotationPageFrame";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { FormActions } from "@/components/ui/FormActions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  PageToolbarActions,
  toolbarButtonClass,
} from "@/components/ui/PageToolbarActions";
import { Tooltip } from "@/components/ui/Tooltip";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { format, parseISO } from "date-fns";
import { formatMoney, parseMoneyInput } from "@/lib/finance/formatMoney";
import { createBlankInvoice, DEFAULT_INVOICE_TERMS, DEFAULT_INVOICE_TERMS_FULL } from "@/lib/invoices/defaults";
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

  const { isLocked, requestUnlock } = usePrivacyLockContext();
  useBodyScrollLock(isLocked);

  useEffect(() => {
    if (isLocked) {
      requestUnlock({
        title: "Unlock invoices",
        description: "Enter your privacy PIN to view and export invoices.",
      });
    }
  }, [isLocked, requestUnlock]);

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

  const activePaymentMode: "full" | "split" | "custom" = useMemo(() => {
    if (draft.paymentMode) return draft.paymentMode;
    if (draft.depositPaid <= 0) return "full";
    if (total > 0 && draft.depositPaid === Math.round(total * 0.5)) return "split";
    return "custom";
  }, [draft.paymentMode, draft.depositPaid, total]);

  return (
    <DashboardMain>
      <div className={cn(isLocked && "blur-md pointer-events-none select-none")}>
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
              Invoice
            </h1>
            <p className="mt-2 text-[13px] text-text-secondary max-w-2xl">
              Generate an invoice for full payment or the remaining balance after deposit.
              Pick a saved quotation to prefill client, event, and pricing details.
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
              <div className="border border-dashed border-border p-6 text-center">
                <FileText
                  className="h-6 w-6 mx-auto text-text-muted mb-2"
                  aria-hidden
                />
                <p className="text-[13px] text-text-primary">
                  No saved quotations yet
                </p>
                <p className="mt-1 text-[12px] text-text-secondary leading-relaxed max-w-sm mx-auto">
                  Save a quotation first, then return here to generate the
                  final invoice.
                </p>
                <Link
                  href="/dashboard/quotations"
                  className="btn-primary inline-flex items-center justify-center mt-4"
                >
                  Draft a quotation
                </Link>
              </div>
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
                        {formatMoney(item.subtotal, item.currency)}
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

                  {draft.currency && draft.currency !== "IDR" ? (
                    <div className="sm:col-span-2 border border-border bg-bg-surface p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[12px] text-text-primary">
                          <span>Currency: <strong>{draft.currency}</strong></span>
                          <span className="mx-2 text-text-muted">·</span>
                          <span>1 {draft.currency} ≈ {formatMoney(draft.exchangeRateToIdr || 1, "IDR")}</span>
                          {draft.exchangeRateDate ? (
                            <span className="text-[10px] text-text-muted ml-1.5">
                              ({format(parseISO(draft.exchangeRateDate), "d MMM yyyy")})
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/currency/rates?from=${draft.currency}`);
                              if (!res.ok) throw new Error();
                              const data = await res.json();
                              updateDraft({
                                exchangeRateToIdr: data.rateToIdr,
                                exchangeRateDate: data.fetchedAt,
                              });
                              toast.success("Updated to today's live rate");
                            } catch {
                              toast.error("Failed to fetch live rate");
                            }
                          }}
                          className="text-[11px] text-text-secondary hover:text-text-primary border border-border bg-bg-secondary px-2 py-1 transition-colors min-h-[36px] flex items-center"
                        >
                          Update to today&apos;s live rate
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] uppercase tracking-label text-text-muted">
                    Payment structure
                  </h2>
                  <span className="text-[11px] text-text-secondary">
                    Total: {formatMoney(total, draft.currency)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateDraft({
                        paymentMode: "full",
                        depositPaid: 0,
                        terms:
                          draft.terms === DEFAULT_INVOICE_TERMS
                            ? DEFAULT_INVOICE_TERMS_FULL
                            : draft.terms,
                      });
                    }}
                    className={cn(
                      "px-2.5 py-2 text-[11px] sm:text-[12px] font-medium border text-center transition-colors rounded-sm",
                      activePaymentMode === "full"
                        ? "border-text-primary bg-bg-elevated text-text-primary shadow-sm"
                        : "border-border bg-bg-primary text-text-muted hover:text-text-primary hover:border-border/80"
                    )}
                  >
                    Full Payment (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const dp50 = Math.round(total * 0.5);
                      updateDraft({
                        paymentMode: "split",
                        depositPaid: dp50,
                        terms:
                          draft.terms === DEFAULT_INVOICE_TERMS_FULL
                            ? DEFAULT_INVOICE_TERMS
                            : draft.terms,
                      });
                    }}
                    className={cn(
                      "px-2.5 py-2 text-[11px] sm:text-[12px] font-medium border text-center transition-colors rounded-sm",
                      activePaymentMode === "split"
                        ? "border-text-primary bg-bg-elevated text-text-primary shadow-sm"
                        : "border-border bg-bg-primary text-text-muted hover:text-text-primary hover:border-border/80"
                    )}
                  >
                    50% DP &amp; Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateDraft({ paymentMode: "custom" });
                    }}
                    className={cn(
                      "px-2.5 py-2 text-[11px] sm:text-[12px] font-medium border text-center transition-colors rounded-sm",
                      activePaymentMode === "custom"
                        ? "border-text-primary bg-bg-elevated text-text-primary shadow-sm"
                        : "border-border bg-bg-primary text-text-muted hover:text-text-primary hover:border-border/80"
                    )}
                  >
                    Custom Nominal
                  </button>
                </div>

                {activePaymentMode === "full" ? (
                  <div className="space-y-2 border border-border/70 bg-bg-primary/50 p-3.5 rounded-sm">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-text-secondary">Amount due on this invoice:</span>
                      <span className="text-[16px] font-medium text-text-primary tabular-nums">
                        {formatMoney(total, draft.currency)}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted">
                      Full payment invoice. No prior quotation deposit is deducted.
                    </p>
                  </div>
                ) : activePaymentMode === "split" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="border border-border/70 bg-bg-primary/50 p-3 rounded-sm">
                      <Label className="text-[11px] text-text-muted">Deposit already paid (50%)</Label>
                      <p className="text-[14px] text-text-primary tabular-nums mt-1 font-medium">
                        {formatMoney(draft.depositPaid, draft.currency)}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">50% quotation advance</p>
                    </div>
                    <div className="border border-border/70 bg-bg-primary/50 p-3 rounded-sm">
                      <Label className="text-[11px] text-text-muted">Balance due on this invoice (50%)</Label>
                      <p className="text-[14px] text-text-primary tabular-nums mt-1 font-medium">
                        {formatMoney(balanceDue, draft.currency)}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">Remaining final balance</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="custom-deposit-paid">
                          Deposit already paid ({draft.currency || "IDR"})
                        </Label>
                        <Input
                          id="custom-deposit-paid"
                          inputMode="numeric"
                          placeholder="0"
                          value={draft.depositPaid > 0 ? String(draft.depositPaid) : ""}
                          onChange={(event) => {
                            const parsed = parseMoneyInput(event.target.value) ?? 0;
                            updateDraft({ depositPaid: parsed });
                          }}
                        />
                        <p className="text-[11px] text-text-muted mt-1">
                          Amount received before this invoice.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="custom-amount-due">
                          Amount due on this invoice ({draft.currency || "IDR"})
                        </Label>
                        <Input
                          id="custom-amount-due"
                          inputMode="numeric"
                          placeholder="0"
                          value={balanceDue > 0 ? String(balanceDue) : ""}
                          onChange={(event) => {
                            const parsed = parseMoneyInput(event.target.value) ?? 0;
                            const newDeposit = Math.max(0, total - parsed);
                            updateDraft({ depositPaid: newDeposit });
                          }}
                        />
                        <p className="text-[11px] text-text-muted mt-1">
                          Remaining nominal to bill on this invoice.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
                      <span>Total contract: {formatMoney(total, draft.currency)}</span>
                      <span>Balance due: {formatMoney(balanceDue, draft.currency)}</span>
                    </div>
                  </div>
                )}
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
        {selectedQuotation ? (
          <div className="lg:hidden sticky bottom-0 -mx-4 sm:-mx-6 mt-8 border-t border-border bg-bg-primary/95 backdrop-blur px-4 sm:px-6 py-3 flex gap-2 z-30 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            <Button
              type="button"
              size="sm"
              className="flex-1 !min-h-[44px]"
              loading={exporting}
              onClick={() => void handleExportPdf()}
              aria-label="Export invoice PDF"
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" aria-hidden />
              PDF
            </Button>
          </div>
        ) : null}
      </div>

      {isLocked ? (
        <div
          className="fixed inset-x-0 bottom-0 top-14 md:top-[60px] z-[45] flex items-center justify-center p-6 pb-[max(1rem,env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-lock-title"
        >
          <div
            className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
            aria-hidden
          />
          <div className="relative max-w-sm w-full border border-border bg-bg-elevated p-6 text-center shadow-lg">
            <Lock className="h-8 w-8 mx-auto text-text-muted mb-4" aria-hidden />
            <h2
              id="invoice-lock-title"
              className="text-lg font-light tracking-[0.05em] uppercase"
            >
              Invoice locked
            </h2>
            <p className="mt-2 text-[13px] text-text-secondary">
              Enter your privacy PIN to view and export invoices.
            </p>
            <FormActions className="mt-5 flex-col sm:flex-row sm:[&_button]:flex-1">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => router.push("/dashboard")}
              >
                Back to Home
              </Button>
              <Button
                type="button"
                className="w-full"
                onClick={() =>
                  requestUnlock({
                    title: "Unlock invoices",
                    description:
                      "Enter your privacy PIN to view and export invoices.",
                  })
                }
              >
                Enter PIN
              </Button>
            </FormActions>
          </div>
        </div>
      ) : null}
    </DashboardMain>
  );
}
