import { format, parseISO } from "date-fns";
import Image from "next/image";
import {
  quotationDownPayment,
  quotationSubtotal,
} from "@/lib/quotations/calculations";
import type { QuotationDraft } from "@/lib/quotations/types";
import { formatMoney } from "@/lib/finance/formatMoney";
import {
  QUOTATION_BANK_ACCOUNTS,
  quotationBalance,
} from "@/lib/quotations/payment";

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
    <dt className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1">
      {children}
    </dt>
  );
}

export function QuotationPreview({ draft }: { draft: QuotationDraft }) {
  const items = draft.lineItems.filter((i) => i.description.trim());
  const deliverables = draft.deliverables.filter((d) => d.description.trim());
  const total = quotationSubtotal(draft.lineItems);
  const downPayment = quotationDownPayment(draft.lineItems);
  const balance = quotationBalance(draft.lineItems);
  const hasEventDetails =
    draft.projectTitle.trim() ||
    draft.eventDate.trim() ||
    draft.eventLocation.trim() ||
    draft.eventDuration.trim();

  return (
    <article className="quotation-document border border-neutral-200 bg-white text-neutral-900 shadow-sm rounded-sm overflow-hidden">
      <header className="border-b border-neutral-200 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex items-start justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Image
              src="/images/logo/MH_logo.png"
              alt="Muhammad Hadid"
              width={48}
              height={48}
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-900">
                Muhammad Hadid
              </p>
              <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">
                Photography
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">
              Quotation
            </p>
            {draft.quoteNumber ? (
              <p className="text-[12px] text-neutral-700 mt-1 tabular-nums break-all">
                {draft.quoteNumber}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-8 sm:py-6 space-y-5 sm:space-y-6 border-b border-neutral-200 text-[13px]">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <MetaLabel>Date</MetaLabel>
            <dd>{formatDisplayDate(draft.quoteDate)}</dd>
          </div>
          <div>
            <MetaLabel>Valid until</MetaLabel>
            <dd>{formatDisplayDate(draft.validUntil)}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <MetaLabel>Prepared for</MetaLabel>
            <dd>{draft.clientName.trim() || "—"}</dd>
            {draft.clientPhone.trim() ? (
              <dd className="text-neutral-600 text-[12px] mt-0.5 break-words">
                {draft.clientPhone.trim()}
              </dd>
            ) : null}
            {draft.clientSocial.trim() ? (
              <dd className="text-neutral-600 text-[12px] mt-0.5 break-words">
                {draft.clientSocial.trim()}
              </dd>
            ) : null}
          </div>
        </dl>
        {hasEventDetails ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {draft.projectTitle.trim() ? (
              <div className="sm:col-span-2">
                <MetaLabel>Event</MetaLabel>
                <dd className="break-words">{draft.projectTitle.trim()}</dd>
              </div>
            ) : null}
            <div>
              <MetaLabel>Event date</MetaLabel>
              <dd>{formatDisplayDate(draft.eventDate)}</dd>
            </div>
            <div>
              <MetaLabel>Duration</MetaLabel>
              <dd>{draft.eventDuration.trim() || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <MetaLabel>Location</MetaLabel>
              <dd className="break-words">{draft.eventLocation.trim() || "—"}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      {deliverables.length > 0 ? (
        <div className="px-4 py-5 sm:px-8 border-b border-neutral-200">
          <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-3">
            Deliverables
          </p>
          <ul className="space-y-2 text-[13px] text-neutral-700">
            {deliverables.map((item) => (
              <li key={item.id} className="flex gap-2 leading-relaxed">
                <span className="text-neutral-400 shrink-0">·</span>
                <span className="break-words">{item.description.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="px-4 py-5 sm:px-8 sm:py-6">
        {items.length === 0 ? (
          <p className="py-8 text-center text-neutral-500 text-[12px]">
            Add line items to preview the quotation
          </p>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto -mx-1 px-1">
              <table className="w-full min-w-[520px] text-[13px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 border-b border-neutral-200">
                    <th className="text-left font-normal pb-3 pr-4">Description</th>
                    <th className="text-right font-normal pb-3 w-12">Qty</th>
                    <th className="text-right font-normal pb-3 w-28">Rate</th>
                    <th className="text-right font-normal pb-3 w-28">Amount</th>
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
            </div>

            <ul className="sm:hidden space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="border border-neutral-200 rounded-sm p-3 space-y-2"
                >
                  <p className="text-[13px] text-neutral-900 break-words leading-relaxed">
                    {item.description.trim()}
                  </p>
                  <dl className="grid grid-cols-3 gap-2 text-[12px]">
                    <div>
                      <dt className="text-neutral-500 uppercase tracking-[0.08em] text-[10px]">
                        Qty
                      </dt>
                      <dd className="tabular-nums mt-0.5">{item.qty}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500 uppercase tracking-[0.08em] text-[10px]">
                        Rate
                      </dt>
                      <dd className="tabular-nums mt-0.5 text-neutral-700">
                        {formatMoney(item.unitPrice)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500 uppercase tracking-[0.08em] text-[10px]">
                        Amount
                      </dt>
                      <dd className="tabular-nums mt-0.5 font-medium">
                        {formatMoney(item.qty * item.unitPrice)}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-4 border-t border-neutral-200 space-y-4">
              <div className="sm:flex sm:justify-end">
                <div className="w-full sm:max-w-xs space-y-3 sm:text-right">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1">
                      Total
                    </p>
                    <p className="text-lg font-light tracking-[0.04em] tabular-nums text-neutral-900">
                      {formatMoney(total)}
                    </p>
                  </div>
                  <div className="border-t border-neutral-100 pt-3">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1">
                      Down payment (50%)
                    </p>
                    <p className="text-[15px] tabular-nums text-neutral-900">
                      {formatMoney(downPayment)}
                    </p>
                    <p className="text-[12px] text-neutral-500 mt-1.5 leading-relaxed">
                      Non-refundable. Required to secure the booking date.
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1">
                      Balance
                    </p>
                    <p className="text-[13px] tabular-nums text-neutral-700">
                      {formatMoney(balance)}
                    </p>
                    <p className="text-[12px] text-neutral-500 mt-1">
                      Due before final delivery of edited images.
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-neutral-100 pt-4">
                <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-2">
                  Payment
                </p>
                <p className="text-[12px] text-neutral-500 mb-3 leading-relaxed">
                  Transfer the down payment to one of the accounts below.
                </p>
                <ul className="space-y-2 text-[13px] text-neutral-700">
                  {QUOTATION_BANK_ACCOUNTS.map((account) => (
                    <li key={account.number} className="break-words">
                      {account.bank} · {account.name} ·{" "}
                      <span className="tabular-nums text-neutral-900">
                        {account.number}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {draft.notes.trim() ? (
        <div className="px-4 py-5 sm:px-8 border-t border-neutral-200">
          <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-2">
            Notes
          </p>
          <p className="text-[13px] text-neutral-700 whitespace-pre-wrap leading-relaxed break-words">
            {draft.notes.trim()}
          </p>
        </div>
      ) : null}

      {draft.terms.trim() ? (
        <div className="px-4 py-5 sm:px-8 border-t border-neutral-200 bg-neutral-50">
          <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-2">
            Terms
          </p>
          <p className="text-[12px] text-neutral-600 whitespace-pre-wrap leading-relaxed break-words">
            {draft.terms.trim()}
          </p>
        </div>
      ) : null}

      <footer className="px-4 py-4 sm:px-8 border-t border-neutral-200 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 text-[10px] uppercase tracking-[0.1em] text-neutral-500">
        <span>Indonesia · Available worldwide</span>
        <span>muhammad-hadid.com</span>
      </footer>
    </article>
  );
}
