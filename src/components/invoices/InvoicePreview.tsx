import { format, parseISO } from "date-fns";
import { forwardRef } from "react";
import { formatMoney } from "@/lib/finance/formatMoney";
import type { InvoiceDraft } from "@/lib/invoices/types";
import {
  quotationFinalBalance,
  quotationSubtotal,
} from "@/lib/quotations/calculations";
import { QUOTATION_BANK_ACCOUNT } from "@/lib/quotations/payment";

function formatTermsParagraph(text: string): string {
  return text.replace(/\s*\n+\s*/g, " ").trim();
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1 leading-none">
      {children}
    </dt>
  );
}

/** Print-layout invoice preview — reuses quotation capture styles. */
export const InvoicePreview = forwardRef<HTMLElement, { draft: InvoiceDraft }>(
  function InvoicePreview({ draft }, ref) {
    const items = draft.lineItems.filter((item) => item.description.trim());
    const deliverables = draft.deliverables.filter((item) =>
      item.description.trim()
    );
    const total = quotationSubtotal(draft.lineItems);
    const balanceDue = quotationFinalBalance(draft.lineItems, draft.depositPaid);
    const hasEventDetails =
      draft.projectTitle.trim() ||
      draft.eventDate.trim() ||
      draft.eventLocation.trim() ||
      draft.eventDuration.trim();

    return (
      <article
        ref={ref}
        className="quotation-document border border-neutral-200 bg-white text-neutral-900"
      >
        <header className="quotation-header border-b border-neutral-200 px-8 py-6">
          <div className="quotation-header-row">
            <div className="quotation-brand">
              <table className="quotation-brand-table" role="presentation">
                <tbody>
                  <tr>
                    <td className="quotation-logo-cell">
                      <div className="quotation-logo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logo/MH_logo.png"
                          alt="Muhammad Hadid"
                          width={48}
                          height={48}
                          style={{ width: 48, height: 48, display: "block" }}
                        />
                      </div>
                    </td>
                    <td className="quotation-brand-text-cell">
                      <div className="quotation-brand-text">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-900 leading-tight m-0">
                          Muhammad Hadid
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 leading-tight m-0 mt-0.5">
                          Photography
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="quotation-header-meta text-right pl-4">
              <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 leading-tight m-0">
                Invoice
              </p>
              {draft.invoiceNumber ? (
                <p className="text-[12px] text-neutral-700 mt-1 tabular-nums break-all m-0 max-w-full">
                  {draft.invoiceNumber}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <section className="quotation-meta px-8 py-6 border-b border-neutral-200 text-[13px]">
          <dl className="grid grid-cols-3 gap-4 m-0">
            <div>
              <MetaLabel>Invoice date</MetaLabel>
              <dd className="m-0">{formatDisplayDate(draft.invoiceDate)}</dd>
            </div>
            <div>
              <MetaLabel>Due date</MetaLabel>
              <dd className="m-0">{formatDisplayDate(draft.dueDate)}</dd>
            </div>
            <div>
              <MetaLabel>Prepared for</MetaLabel>
              <dd className="m-0">{draft.clientName.trim() || "—"}</dd>
              {draft.clientPhone.trim() ? (
                <dd className="text-neutral-600 text-[12px] mt-0.5 break-words m-0">
                  {draft.clientPhone.trim()}
                </dd>
              ) : null}
              {draft.clientSocial.trim() ? (
                <dd className="text-neutral-600 text-[12px] mt-0.5 break-words m-0">
                  {draft.clientSocial.trim()}
                </dd>
              ) : null}
            </div>
          </dl>
          {draft.quoteNumber.trim() ? (
            <p className="text-[12px] text-neutral-600 mt-4 m-0">
              Reference quotation{" "}
              <span className="text-neutral-900 tabular-nums">
                {draft.quoteNumber.trim()}
              </span>
            </p>
          ) : null}
        </section>

        {hasEventDetails ? (
          <section className="quotation-event px-8 py-6 border-b border-neutral-200 text-[13px]">
            <dl className="grid grid-cols-2 gap-4 m-0">
              {draft.projectTitle.trim() ? (
                <div className="col-span-2">
                  <MetaLabel>Event</MetaLabel>
                  <dd className="break-words m-0">
                    {draft.projectTitle.trim()}
                  </dd>
                </div>
              ) : null}
              <div>
                <MetaLabel>Event date</MetaLabel>
                <dd className="m-0">{formatDisplayDate(draft.eventDate)}</dd>
              </div>
              <div>
                <MetaLabel>Duration</MetaLabel>
                <dd className="m-0">{draft.eventDuration.trim() || "—"}</dd>
              </div>
              <div className="col-span-2">
                <MetaLabel>Location</MetaLabel>
                <dd className="break-words m-0">
                  {draft.eventLocation.trim() || "—"}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        {deliverables.length > 0 ? (
          <section className="quotation-deliverables px-8 py-5 border-b border-neutral-200">
            <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-3 m-0">
              Deliverables
            </p>
            <ul className="space-y-2 text-[13px] text-neutral-700 m-0 p-0 list-none">
              {deliverables.map((item) => (
                <li key={item.id} className="flex gap-2 leading-relaxed m-0">
                  <span className="text-neutral-400 shrink-0">·</span>
                  <span className="break-words">{item.description.trim()}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="px-8 py-6">
          {items.length === 0 ? (
            <p className="py-8 text-center text-neutral-500 text-[12px] m-0">
              Select a quotation to preview the invoice
            </p>
          ) : (
            <>
              <section className="quotation-line-item">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 border-b border-neutral-200">
                      <th className="text-left font-normal pb-3 pr-4">
                        Description
                      </th>
                      <th className="text-right font-normal pb-3 w-12">Qty</th>
                      <th className="text-right font-normal pb-3 w-28">Rate</th>
                      <th className="text-right font-normal pb-3 w-28">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-neutral-100 align-top"
                      >
                        <td className="py-3 pr-4 text-neutral-900 break-words">
                          {item.description.trim()}
                        </td>
                        <td className="py-3 text-right tabular-nums text-neutral-600">
                          {item.qty}
                        </td>
                        <td className="py-3 text-right tabular-nums text-neutral-600">
                          {formatMoney(item.unitPrice)}
                        </td>
                        <td className="py-3 text-right tabular-nums text-neutral-900">
                          {formatMoney(item.qty * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <div className="mt-6 pt-4 border-t border-neutral-200 space-y-4">
                <section className="quotation-totals flex justify-end">
                  <div className="w-full max-w-xs space-y-3 text-right">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1 m-0">
                        Total contract value
                      </p>
                      <p className="text-[15px] tabular-nums text-neutral-900 m-0">
                        {formatMoney(total)}
                      </p>
                    </div>
                    <div className="border-t border-neutral-100 pt-3">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1 m-0">
                        Deposit paid
                      </p>
                      <p className="text-[15px] tabular-nums text-neutral-900 m-0">
                        {formatMoney(draft.depositPaid)}
                      </p>
                      <p className="text-[12px] text-neutral-500 mt-1.5 leading-relaxed m-0">
                        Received per quotation. Non-refundable.
                      </p>
                    </div>
                    <div className="border-t border-neutral-200 pt-3">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1 m-0">
                        Balance due
                      </p>
                      <p className="text-lg font-light tracking-[0.04em] tabular-nums text-neutral-900 m-0">
                        {formatMoney(balanceDue)}
                      </p>
                    </div>
                  </div>
                </section>
                <section className="quotation-payment border-t border-neutral-100 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-2 m-0">
                    Payment
                  </p>
                  <p className="text-[12px] text-neutral-500 mb-3 leading-relaxed m-0">
                    Transfer the balance due to the account below.
                  </p>
                  <div className="space-y-1">
                    <p className="text-[13px] text-neutral-700 m-0">
                      {QUOTATION_BANK_ACCOUNT.bank} ·{" "}
                      {QUOTATION_BANK_ACCOUNT.name}
                    </p>
                    <p className="text-[15px] tabular-nums tracking-[0.02em] text-neutral-900 m-0">
                      {QUOTATION_BANK_ACCOUNT.number}
                    </p>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>

        {draft.notes.trim() ? (
          <div className="px-8 py-5 border-t border-neutral-200">
            <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-2 m-0">
              Notes
            </p>
            <p className="text-[13px] text-neutral-700 whitespace-pre-wrap leading-relaxed break-words m-0">
              {draft.notes.trim()}
            </p>
          </div>
        ) : null}

        <div className="border-t border-neutral-200">
          {draft.terms.trim() ? (
            <section className="quotation-terms px-8 pt-3 pb-2 bg-neutral-50">
              <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1 m-0">
                Terms
              </p>
              <p className="text-[10px] text-neutral-500 leading-[1.45] break-words text-justify m-0">
                {formatTermsParagraph(draft.terms)}
              </p>
            </section>
          ) : null}

          <footer className="border-t border-neutral-200 px-8 py-2.5">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="text-[10px] uppercase tracking-[0.1em] text-neutral-500">
                  <td className="text-left align-middle">
                    Indonesia · Available worldwide
                  </td>
                  <td className="text-right align-middle whitespace-nowrap">
                    muhammad-hadid.com
                  </td>
                </tr>
              </tbody>
            </table>
          </footer>
        </div>
      </article>
    );
  }
);
