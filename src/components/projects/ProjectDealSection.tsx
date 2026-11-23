"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowUpRight, CheckCircle2, Clock, FileText, MessageSquare, Receipt, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MaskedMoney } from "@/components/privacy/MaskedMoney";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import { formatMoney } from "@/lib/finance/formatMoney";
import { quotationDownPayment } from "@/lib/quotations/calculations";
import { PaymentStatusBadge } from "@/components/common/PaymentStatusBadge";
import { PaymentStatusButton } from "@/components/common/PaymentStatusButton";
import {
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
} from "@/lib/calendar/serviceTags";
import type { CalendarEvent, IncomeEntry, Project } from "@/lib/types";
import type { SavedQuotation } from "@/lib/quotations/db";

export function ProjectDealSection({
  project,
  event = null,
  quotation,
  income,
  onIncomeUpdated,
}: {
  project: Project;
  event?: CalendarEvent | null;
  quotation: SavedQuotation | null;
  income: IncomeEntry | null;
  onIncomeUpdated?: () => void;
}) {
  const router = useRouter();
  const { moneyVisible, isLocked } = usePrivacyLockContext();
  const showAmounts = moneyVisible && !isLocked;

  const [currentPaid, setCurrentPaid] = useState(income?.amount ?? 0);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    setCurrentPaid(income?.amount ?? 0);
  }, [income]);

  const currency = quotation?.currency || "IDR";
  const isForeign = currency !== "IDR";
  const lockedRate = quotation?.exchange_rate_to_idr || 1;
  const [settlementRate, setSettlementRate] = useState(lockedRate);
  const [showRateEdit, setShowRateEdit] = useState(false);

  useEffect(() => {
    if (quotation?.exchange_rate_to_idr) {
      setSettlementRate(quotation.exchange_rate_to_idr);
    }
  }, [quotation?.exchange_rate_to_idr]);

  const totalQuoted = quotation?.subtotal ?? 0;
  const totalQuotedIdr =
    quotation?.total_idr ??
    (isForeign ? Math.round(totalQuoted * lockedRate) : totalQuoted);

  const currentPaidIdr = currentPaid;
  const currentPaidForeign = isForeign
    ? income?.original_amount ??
      (lockedRate > 0 ? currentPaidIdr / lockedRate : 0)
    : currentPaidIdr;

  const balanceRemainingForeign = isForeign
    ? Math.max(0, totalQuoted - currentPaidForeign)
    : Math.max(0, totalQuoted - currentPaidIdr);

  const balanceRemainingIdr = isForeign
    ? Math.max(0, totalQuotedIdr - currentPaidIdr)
    : Math.max(0, totalQuoted - currentPaidIdr);

  const isPaidInFull = isForeign
    ? balanceRemainingForeign <= 0
    : balanceRemainingIdr <= 0;

  const clientPhone = quotation?.client_phone?.trim() ?? "";
  const clientSocial = quotation?.client_social?.trim() ?? "";

  const whatsappUrl = clientPhone
    ? `https://wa.me/${clientPhone.replace(/\D/g, "")}`
    : null;

  async function handleMarkBalancePaid() {
    if (!quotation || isPaidInFull) return;
    setMarkingPaid(true);

    try {
      const pelunasanForeign = balanceRemainingForeign;
      const pelunasanIdr = isForeign
        ? Math.round(pelunasanForeign * settlementRate)
        : balanceRemainingIdr;
      const finalTotalIdr = currentPaidIdr + pelunasanIdr;

      const res = await fetch("/api/finance/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_date: format(new Date(), "yyyy-MM-dd"),
          amount: finalTotalIdr,
          currency: currency,
          exchange_rate_to_idr: settlementRate,
          exchange_rate_date: format(new Date(), "yyyy-MM-dd"),
          original_amount: isForeign ? totalQuoted : null,
          client_name: project.client_name,
          description: `Pelunasan: ${quotation.quote_number} (${project.name})`,
          event_id: event?.id || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to mark balance as paid");
        setMarkingPaid(false);
        return;
      }

      await Promise.all([
        fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_status: "paid_in_full" }),
        }).catch(() => null),
        event?.id
          ? fetch(`/api/calendar/events/${event.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payment_status: "paid_in_full" }),
            }).catch(() => null)
          : Promise.resolve(),
      ]);

      toast.success("Balance marked as paid in full");
      setCurrentPaid(finalTotalIdr);
      setMarkingPaid(false);
      router.refresh();
      if (onIncomeUpdated) onIncomeUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
      setMarkingPaid(false);
    }
  }

  async function handleMarkDepositPaid() {
    if (!quotation) return;
    setMarkingPaid(true);

    try {
      const dpAmount = quotationDownPayment(quotation.line_items);
      const expectedDp =
        dpAmount > 0 ? dpAmount : Math.round(totalQuoted * 0.5);
      const expectedDpIdr = isForeign
        ? Math.round(expectedDp * lockedRate)
        : expectedDp;

      const res = await fetch("/api/finance/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_date: format(new Date(), "yyyy-MM-dd"),
          amount: expectedDpIdr,
          currency: currency,
          exchange_rate_to_idr: lockedRate,
          exchange_rate_date: format(new Date(), "yyyy-MM-dd"),
          original_amount: isForeign ? expectedDp : null,
          client_name: project.client_name,
          description: `DP: ${quotation.quote_number} (${project.name})`,
          event_id: event?.id || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to mark deposit as paid");
        setMarkingPaid(false);
        return;
      }

      await Promise.all([
        fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_status: "deposit_paid" }),
        }).catch(() => null),
        event?.id
          ? fetch(`/api/calendar/events/${event.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payment_status: "deposit_paid" }),
            }).catch(() => null)
          : Promise.resolve(),
      ]);

      toast.success("Deposit marked as paid");
      setCurrentPaid(expectedDpIdr);
      setMarkingPaid(false);
      router.refresh();
      if (onIncomeUpdated) onIncomeUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
      setMarkingPaid(false);
    }
  }

  async function handleDirectPaymentStatusChange(newStatus: PaymentStatus) {
    try {
      await Promise.all([
        fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_status: newStatus }),
        }),
        event?.id
          ? fetch(`/api/calendar/events/${event.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payment_status: newStatus }),
            })
          : Promise.resolve(),
      ]);
      toast.success(`Payment marked as ${PAYMENT_STATUS_LABELS[newStatus]}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    }
  }

  return (
    <div className="space-y-6">
      {quotation ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border bg-bg-secondary p-4 sm:p-5">
            <span className="text-[11px] uppercase tracking-label text-text-muted">
              Quotation
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[15px] text-text-primary font-medium tracking-[0.03em] tabular-nums">
                {quotation.quote_number}
              </span>
              <Link
                href={`/dashboard/quotations?id=${quotation.id}`}
                className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
              >
                View
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
            <p className="mt-2 text-[12px] text-text-muted">
              {quotation.project_title || "Photography Package"}
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Package Total</span>
              <div className="text-right">
                <span className="text-[14px] text-text-primary tabular-nums font-medium block">
                  <MaskedMoney
                    amount={totalQuoted}
                    currency={currency}
                    visible={showAmounts}
                  />
                </span>
                {isForeign ? (
                  <span className="text-[11px] text-text-muted tabular-nums block">
                    ≈ {formatMoney(totalQuotedIdr, "IDR")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border border-border bg-bg-secondary p-4 sm:p-5">
            <span className="text-[11px] uppercase tracking-label text-text-muted">
              Payment &amp; Down Payment
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <div>
                <span className="text-[15px] text-status-delivered font-medium tabular-nums block">
                  <MaskedMoney
                    amount={currentPaidIdr}
                    currency="IDR"
                    visible={showAmounts}
                  />
                </span>
                {isForeign ? (
                  <span className="text-[11px] text-text-muted tabular-nums block">
                    ≈ {formatMoney(currentPaidForeign, currency)}
                  </span>
                ) : null}
              </div>
              <PaymentStatusBadge
                status={isPaidInFull && totalQuoted > 0 ? "paid_in_full" : currentPaid > 0 ? "deposit_paid" : "unpaid"}
                size="xs"
              />
            </div>
            <p className="mt-2 text-[12px] text-text-muted">
              {isPaidInFull
                ? "Total package value paid in full"
                : currentPaid > 0
                  ? "Deposit paid. Remaining balance due on shoot / delivery."
                  : "No payment received yet."}
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Balance Due</span>
              <div className="text-right">
                <span className="text-[14px] text-text-secondary tabular-nums font-medium block">
                  <MaskedMoney
                    amount={
                      isForeign ? balanceRemainingForeign : balanceRemainingIdr
                    }
                    currency={currency}
                    visible={showAmounts}
                  />
                </span>
                {isForeign ? (
                  <span className="text-[11px] text-text-muted tabular-nums block">
                    ≈ {formatMoney(balanceRemainingIdr, "IDR")}
                  </span>
                ) : null}
              </div>
            </div>
            {!isPaidInFull && totalQuoted > 0 ? (
              <div className="mt-3 space-y-2">
                {isForeign ? (
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
                      <span>Settlement rate: 1 {currency}</span>
                      <button
                        type="button"
                        onClick={() => setShowRateEdit((p) => !p)}
                        className="text-text-secondary hover:text-text-primary underline text-[10px]"
                      >
                        {showRateEdit ? "Done" : "Adjust rate"}
                      </button>
                    </div>
                    {showRateEdit ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-text-muted">Rp</span>
                        <input
                          type="number"
                          step="any"
                          value={settlementRate}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (Number.isFinite(val) && val > 0)
                              setSettlementRate(val);
                          }}
                          className="w-full h-7 px-2 text-[12px] bg-bg-surface border border-border text-text-primary"
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-text-secondary tabular-nums">
                        Rp {Math.round(settlementRate).toLocaleString("id-ID")}
                      </p>
                    )}
                  </div>
                ) : null}
                {currentPaid <= 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={markingPaid}
                      disabled={markingPaid}
                      onClick={() => void handleMarkDepositPaid()}
                      className="w-full !text-[11px] !min-h-[44px] sm:!min-h-9 !py-1.5 uppercase tracking-label font-medium text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    >
                      <Clock className="h-3.5 w-3.5 mr-1" aria-hidden />
                      Mark Deposit Paid
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={markingPaid}
                      disabled={markingPaid}
                      onClick={() => void handleMarkBalancePaid()}
                      className="w-full !text-[11px] !min-h-[44px] sm:!min-h-9 !py-1.5 uppercase tracking-label font-medium text-status-delivered border-status-delivered/30 hover:bg-status-delivered/10"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" aria-hidden />
                      Mark Full Paid
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    loading={markingPaid}
                    disabled={markingPaid}
                    onClick={() => void handleMarkBalancePaid()}
                    className="w-full !text-[11px] !min-h-[44px] sm:!min-h-9 !py-1.5 uppercase tracking-label font-medium text-status-delivered border-status-delivered/30 hover:bg-status-delivered/10"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" aria-hidden />
                    Mark Balance Paid (Pelunasan)
                  </Button>
                )}
              </div>
            ) : null}
          </div>

          <div className="border border-border bg-bg-secondary p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-label text-text-muted">
                Invoice &amp; Billing
              </span>
              <p className="mt-1 text-[13px] text-text-primary">
                1-Click Invoice
              </p>
              <p className="mt-1 text-[12px] text-text-secondary leading-relaxed">
                Generate or export the client invoice prefilled from this quote.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <Link
                href={`/dashboard/invoices?from=${encodeURIComponent(quotation.id)}`}
                className="w-full inline-flex items-center justify-center gap-1.5 btn-primary !text-[11px] !min-h-[44px] sm:!min-h-9 !py-2 uppercase tracking-label font-medium"
              >
                <Receipt className="h-3.5 w-3.5" aria-hidden />
                Generate Invoice
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-border p-6 text-center">
          <FileText className="h-6 w-6 mx-auto text-text-muted mb-2" aria-hidden />
          <h3 className="text-[13px] text-text-primary">No quotation linked</h3>
          <p className="mt-1 text-[12px] text-text-secondary max-w-md mx-auto leading-relaxed">
            This project was created directly without a quotation. You can create a new quote to lock in pricing and terms.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/dashboard/quotations?project_id=${project.id}&client=${encodeURIComponent(project.client_name || "")}&title=${encodeURIComponent(project.name)}`}
              className="btn-secondary !text-[11px] !min-h-[44px] sm:!min-h-9 !px-4 !py-2 inline-flex items-center gap-1.5 uppercase tracking-label"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Create Quotation
            </Link>
            <PaymentStatusButton
              status={project.payment_status}
              onChange={handleDirectPaymentStatusChange}
            />
          </div>
        </div>
      )}

      {/* Client Contact & Profile Card */}
      <div className="border border-border bg-bg-secondary p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-text-muted" aria-hidden />
            <h3 className="text-[11px] uppercase tracking-label text-text-muted">
              Client Contact Information
            </h3>
          </div>
          {project.client_name ? (
            <Link
              href="/dashboard/clients"
              className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary"
            >
              Client Book →
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[11px] text-text-muted">Client Name</span>
            <p className="text-[14px] text-text-primary font-medium mt-0.5">
              {project.client_name || "Unassigned"}
            </p>
          </div>

          <div>
            <span className="text-[11px] text-text-muted">Phone Number</span>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[13px] text-text-primary">
                {clientPhone || "No phone added"}
              </p>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-status-delivered hover:opacity-80 p-1"
                  aria-label="Chat on WhatsApp"
                >
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                </a>
              ) : null}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-text-muted">Social / Instagram</span>
            <p className="text-[13px] text-text-primary mt-0.5">
              {clientSocial || "No social handle"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
