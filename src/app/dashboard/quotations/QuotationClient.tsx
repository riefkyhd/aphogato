"use client";

import { ArrowLeft, FileDown, Plus, Receipt, RotateCcw, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FEATURES } from "@/lib/features";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { ClientEventTools } from "@/components/quotations/ClientEventTools";
import { ClientNameInput } from "@/components/clients/ClientNameInput";
import { buildCalendarPrefillUrl } from "@/lib/quotations/calendarPrefill";
import { QuotationArchive } from "@/components/quotations/QuotationArchive";
import { QuotationConfirmDialog } from "@/components/quotations/QuotationConfirmDialog";
import { QuotationPageFrame } from "@/components/quotations/QuotationPageFrame";
import { QuotationPreview } from "@/components/quotations/QuotationPreview";
import { BackNavLink } from "@/components/BackNavLink";
import { SalesSectionNav } from "@/components/sales/SalesSectionNav";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  PageToolbarActions,
  toolbarButtonClass,
} from "@/components/ui/PageToolbarActions";
import { Tooltip } from "@/components/ui/Tooltip";
import { parseMoneyInput } from "@/lib/finance/formatMoney";
import {
  createBlankQuotation,
  createEmptyDeliverable,
  createEmptyLineItem,
  QUOTATION_STORAGE_KEY,
} from "@/lib/quotations/defaults";
import { useUnsavedChangesGuard } from "@/lib/hooks/useUnsavedChangesGuard";
import { peekNextBaseQuoteNumber, peekNextRevisionQuoteNumber } from "@/lib/quotations/quoteNumber";
import {
  blankQuotationSession,
  parseStoredQuotationSession,
  resolveRestoredQuotationSession,
  serializeQuotationSession,
} from "@/lib/quotations/sessionStorage";
import {
  type SavedQuotation,
  savedQuotationToDraft,
} from "@/lib/quotations/db";
import { exportQuotationPdf } from "@/lib/quotations/exportQuotationPdf";
import type {
  QuotationDeliverable,
  QuotationDraft,
  QuotationLineItem,
} from "@/lib/quotations/types";
import type { PriceListItem } from "@/lib/types";

function hasDraftContent(draft: QuotationDraft): boolean {
  return Boolean(
    draft.clientName.trim() ||
      draft.clientPhone.trim() ||
      draft.clientSocial.trim() ||
      draft.projectTitle.trim() ||
      draft.eventDate.trim() ||
      draft.eventLocation.trim() ||
      draft.eventDuration.trim() ||
      draft.notes.trim() ||
      draft.lineItems.some(
        (item) => item.description.trim() || item.unitPrice > 0
      ) ||
      draft.deliverables.some((item) => item.description.trim())
  );
}

export function QuotationClient({
  priceListItems,
  initialSavedQuotations,
}: {
  priceListItems: PriceListItem[];
  initialSavedQuotations: SavedQuotation[];
}) {
  const [draft, setDraft] = useState<QuotationDraft>(() =>
    createBlankQuotation()
  );
  const [savedQuotations, setSavedQuotations] = useState(
    initialSavedQuotations
  );
  const [savedId, setSavedId] = useState<string | null>(null);
  const [revisionParentId, setRevisionParentId] = useState<string | null>(null);
  const [draftRevision, setDraftRevision] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const pdfExportRef = useRef<HTMLElement>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedQuotation | null>(null);
  const [discardAction, setDiscardAction] = useState<
    | { type: "new" }
    | { type: "load"; item: SavedQuotation }
    | { type: "revision"; item: SavedQuotation }
    | null
  >(null);

  const needsDiscardConfirm = useCallback(
    () => savedId !== null || hasDraftContent(draft),
    [draft, savedId]
  );

  useUnsavedChangesGuard(
    hydrated && savedId === null && hasDraftContent(draft),
    "You have an unsaved quotation draft. Leave this page?"
  );

  const loadSavedItem = useCallback((item: SavedQuotation) => {
    setSavedId(item.id);
    setRevisionParentId(item.parent_id);
    setDraftRevision(item.revision);
    setDraft(savedQuotationToDraft(item));
    toast.success(`Loaded ${item.quote_number}`);
  }, []);

  const startNewBaseDraft = useCallback(() => {
    setSavedId(null);
    setRevisionParentId(null);
    setDraftRevision(0);
    setDraft(createBlankQuotation(peekNextBaseQuoteNumber(savedQuotations)));
  }, [savedQuotations]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUOTATION_STORAGE_KEY);
      const snapshot = raw
        ? parseStoredQuotationSession(raw)
        : null;
      const resolved = snapshot
        ? resolveRestoredQuotationSession(snapshot, initialSavedQuotations)
        : blankQuotationSession(initialSavedQuotations);

      setSavedId(resolved.savedId);
      setRevisionParentId(resolved.revisionParentId);
      setDraftRevision(resolved.draftRevision);
      setDraft(resolved.draft);
    } catch {
      const blank = blankQuotationSession(initialSavedQuotations);
      setSavedId(blank.savedId);
      setRevisionParentId(blank.revisionParentId);
      setDraftRevision(blank.draftRevision);
      setDraft(blank.draft);
    } finally {
      setHydrated(true);
    }
  }, [initialSavedQuotations]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      QUOTATION_STORAGE_KEY,
      serializeQuotationSession({
        draft,
        savedId,
        revisionParentId,
        draftRevision,
      })
    );
  }, [draft, draftRevision, hydrated, revisionParentId, savedId]);

  const updateDraft = useCallback(
    (patch: Partial<QuotationDraft>) => {
      setDraft((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const updateLineItem = useCallback(
    (id: string, patch: Partial<QuotationLineItem>) => {
      setDraft((prev) => ({
        ...prev,
        lineItems: prev.lineItems.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      }));
    },
    []
  );

  const updateDeliverable = useCallback(
    (id: string, patch: Partial<QuotationDeliverable>) => {
      setDraft((prev) => ({
        ...prev,
        deliverables: prev.deliverables.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      }));
    },
    []
  );

  const addDeliverable = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      deliverables: [...prev.deliverables, createEmptyDeliverable()],
    }));
  }, []);

  const removeDeliverable = useCallback((id: string) => {
    setDraft((prev) => {
      const next = prev.deliverables.filter((item) => item.id !== id);
      return {
        ...prev,
        deliverables: next.length > 0 ? next : [createEmptyDeliverable()],
      };
    });
  }, []);

  const addLineItem = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, createEmptyLineItem()],
    }));
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setDraft((prev) => {
      const next = prev.lineItems.filter((item) => item.id !== id);
      return {
        ...prev,
        lineItems: next.length > 0 ? next : [createEmptyLineItem()],
      };
    });
  }, []);

  const addFromPriceList = useCallback(
    (item: PriceListItem) => {
      setDraft((prev) => ({
        ...prev,
        lineItems: [
          ...prev.lineItems,
          {
            id: createEmptyLineItem().id,
            description: item.notes?.trim()
              ? `${item.name}, ${item.notes.trim()}`
              : item.name,
            qty: 1,
            unitPrice: item.amount,
          },
        ],
      }));
      toast.success(`Added ${item.name}`);
    },
    []
  );

  const applyRevisionDraft = useCallback(
    (source: SavedQuotation) => {
      const next = peekNextRevisionQuoteNumber(source, savedQuotations);
      setSavedId(null);
      setRevisionParentId(next.parentId);
      setDraftRevision(next.revision);
      setDraft({
        ...savedQuotationToDraft(source),
        quoteNumber: next.quoteNumber,
      });
      toast.success(`Revision draft ${next.quoteNumber} ready`);
    },
    [savedQuotations]
  );

  const requestNewDraft = useCallback(() => {
    if (needsDiscardConfirm()) {
      setDiscardAction({ type: "new" });
      return;
    }
    startNewBaseDraft();
    toast.success("New quotation started");
  }, [needsDiscardConfirm, startNewBaseDraft]);

  const requestRevision = useCallback(
    (source: SavedQuotation) => {
      if (needsDiscardConfirm()) {
        setDiscardAction({ type: "revision", item: source });
        return;
      }
      applyRevisionDraft(source);
    },
    [applyRevisionDraft, needsDiscardConfirm]
  );

  const confirmDiscard = useCallback(() => {
    if (!discardAction) return;

    switch (discardAction.type) {
      case "new":
        startNewBaseDraft();
        toast.success("New quotation started");
        break;
      case "load":
        loadSavedItem(discardAction.item);
        break;
      case "revision":
        applyRevisionDraft(discardAction.item);
        break;
    }

    setDiscardAction(null);
  }, [
    applyRevisionDraft,
    discardAction,
    loadSavedItem,
    startNewBaseDraft,
  ]);

  const handleSave = useCallback(async () => {
    if (savedId) return;

    setSaving(true);
    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          parentId: revisionParentId,
          revision: draftRevision,
        }),
      });
      const payload = (await response.json()) as
        | SavedQuotation
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to save quotation"
        );
      }

      const saved = payload as SavedQuotation;
      setSavedId(saved.id);
      setRevisionParentId(saved.parent_id);
      setDraftRevision(saved.revision);
      setSavedQuotations((prev) => {
        const next = prev.filter((item) => item.id !== saved.id);
        return [saved, ...next];
      });
      toast.success(
        saved.revision > 0 ? "Revision saved" : "Quotation saved"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [draft, draftRevision, revisionParentId, savedId]);

  const handleLoadSaved = useCallback(
    (item: SavedQuotation) => {
      if (needsDiscardConfirm()) {
        setDiscardAction({ type: "load", item });
        return;
      }
      loadSavedItem(item);
    },
    [loadSavedItem, needsDiscardConfirm]
  );

  const handleDeleteSaved = useCallback(async () => {
    if (!deleteTarget) return;

    const id = deleteTarget.id;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete quotation");
      }

      setSavedQuotations((prev) => prev.filter((entry) => entry.id !== id));
      if (savedId === id) {
        setSavedId(null);
        setRevisionParentId(null);
        setDraftRevision(0);
        startNewBaseDraft();
      }
      setDeleteTarget(null);
      toast.success("Quotation deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }, [deleteTarget, savedId, startNewBaseDraft]);

  const handleExportPdf = useCallback(async () => {
    const exportRoot = pdfExportRef.current;
    if (!exportRoot) {
      toast.error("Preview not ready for export");
      return;
    }

    setExporting(true);
    try {
      await exportQuotationPdf(draft, exportRoot);
      toast.success("Quotation PDF downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [draft]);

  const activePrices = priceListItems.filter((i) => i.active);
  const canSave = savedId === null;
  const discardDescription =
    discardAction?.type === "new"
      ? "Starting a new quotation will discard the current draft in this form."
      : discardAction?.type === "load"
        ? `Loading ${discardAction.item.quote_number} will replace the current draft in this form.`
        : discardAction?.type === "revision"
          ? `Creating ${peekNextRevisionQuoteNumber(discardAction.item, savedQuotations).quoteNumber} will replace the current draft in this form.`
          : "";

  return (
    <DashboardMain>
      <QuotationConfirmDialog
        open={discardAction !== null}
        title="Discard current draft?"
        description={discardDescription}
        confirmLabel="Continue"
        onClose={() => setDiscardAction(null)}
        onConfirm={confirmDiscard}
      />
      <QuotationConfirmDialog
        open={deleteTarget !== null}
        title="Delete quotation?"
        description={
          deleteTarget
            ? `${deleteTarget.quote_number} will be removed from the archive. This cannot be undone.`
            : ""
        }
        confirmLabel={deletingId ? "Deleting…" : "Delete quotation"}
        confirming={deletingId !== null}
        destructive
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => void handleDeleteSaved()}
      />
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
              Quotation
            </h1>
            <p className="mt-2 text-[13px] text-text-secondary max-w-2xl">
              Build a client-ready quote for Muhammad Hadid Photography. Save to
              archive for administration. Your current draft also persists in
              this browser until you start a new one.
            </p>
          </div>
          <PageToolbarActions>
            {FEATURES.invoices ? (
              <Tooltip label="Final payment invoice">
                <Link
                  href="/dashboard/invoices"
                  className={`btn-secondary !text-[11px] !min-h-9 !px-3 !py-2 inline-flex items-center justify-center gap-1.5 ${toolbarButtonClass}`}
                >
                  <Receipt className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Invoice
                </Link>
              </Tooltip>
            ) : null}
            <Tooltip
              label={
                canSave
                  ? draftRevision > 0
                    ? "Save revision to archive"
                    : "Save to archive"
                  : "Load a revision from archive to save updates"
              }
            >
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={toolbarButtonClass}
                loading={saving}
                disabled={!canSave}
                onClick={() => void handleSave()}
                aria-label="Save quotation"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                Save
              </Button>
            </Tooltip>
            <Tooltip label="Start a new quotation">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={toolbarButtonClass}
                onClick={requestNewDraft}
                aria-label="Reset quotation"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                New
              </Button>
            </Tooltip>
            <Tooltip label="Download PDF">
              <Button
                type="button"
                size="sm"
                className={toolbarButtonClass}
                loading={exporting}
                onClick={() => void handleExportPdf()}
                aria-label="Export PDF"
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
                Archive
              </h2>
              <span className="text-[11px] text-text-muted tabular-nums">
                {savedQuotations.length} saved
              </span>
            </div>
            <QuotationArchive
              items={savedQuotations}
              activeId={savedId}
              onLoad={handleLoadSaved}
              onRevision={requestRevision}
              onFinalInvoice={(item) => {
                window.location.assign(
                  `/dashboard/invoices?from=${encodeURIComponent(item.id)}`
                );
              }}
              onRequestDelete={setDeleteTarget}
              deletingId={deletingId}
            />
          </section>

          <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
            <h2 className="text-[11px] uppercase tracking-label text-text-muted">
              Quote details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quote-number">Quote no.</Label>
                <p
                  id="quote-number"
                  className="text-[15px] text-text-primary tracking-[0.03em] tabular-nums py-2"
                >
                  {draft.quoteNumber || peekNextBaseQuoteNumber(savedQuotations)}
                </p>
                {draftRevision > 0 ? (
                  <p className="text-[11px] text-text-muted mt-1">
                    Revision draft
                  </p>
                ) : (
                  <p className="text-[11px] text-text-muted mt-1">
                    Next base: {peekNextBaseQuoteNumber(savedQuotations)}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="quote-date">Date</Label>
                <Input
                  id="quote-date"
                  type="date"
                  value={draft.quoteDate}
                  onChange={(e) => updateDraft({ quoteDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="valid-until">Valid until</Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={draft.validUntil}
                  onChange={(e) => updateDraft({ validUntil: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
            <h2 className="text-[11px] uppercase tracking-label text-text-muted">
              Client & event
            </h2>
            <ClientEventTools onApply={updateDraft} />
            <div>
              <p className="text-[10px] uppercase tracking-label text-text-muted mb-3">
                Client
              </p>
            </div>
            <ClientNameInput
              id="client-name"
              label="Name"
              value={draft.clientName}
              onChange={(value) => updateDraft({ clientName: value })}
              placeholder="Andrew & Katherine"
            />
            <div>
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                type="tel"
                value={draft.clientPhone}
                onChange={(e) =>
                  updateDraft({ clientPhone: e.target.value })
                }
                placeholder="+62 812 3456 7890"
              />
            </div>
            <div>
              <Label htmlFor="client-social">Social</Label>
              <Input
                id="client-social"
                value={draft.clientSocial}
                onChange={(e) =>
                  updateDraft({ clientSocial: e.target.value })
                }
                placeholder="@username / IG, WA, dll."
              />
            </div>
            <div className="pt-2 border-t border-border/70">
              <p className="text-[10px] uppercase tracking-label text-text-muted mb-3">
                Event
              </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="event-name">Event name</Label>
                <Input
                  id="event-name"
                  value={draft.projectTitle}
                  onChange={(e) =>
                    updateDraft({ projectTitle: e.target.value })
                  }
                  placeholder="Andrew & Katherine Wedding"
                />
              </div>
              <div>
                <Label htmlFor="event-date">Event date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={draft.eventDate}
                  onChange={(e) => updateDraft({ eventDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="event-duration">Duration</Label>
                <Input
                  id="event-duration"
                  value={draft.eventDuration}
                  onChange={(e) =>
                    updateDraft({ eventDuration: e.target.value })
                  }
                  placeholder="8 hours / Full day"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  value={draft.eventLocation}
                  onChange={(e) =>
                    updateDraft({ eventLocation: e.target.value })
                  }
                  placeholder="Hotel Mulia, Jakarta"
                />
              </div>
            </div>
            {FEATURES.calendar ? (
              <div className="mt-4">
                {buildCalendarPrefillUrl(draft) ? (
                  <Link
                    href={buildCalendarPrefillUrl(draft)!}
                    className="text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors"
                  >
                    Add to calendar
                  </Link>
                ) : (
                  <p className="text-[12px] text-text-muted leading-relaxed">
                    Add event name and date to open the calendar with details
                    prefilled.
                  </p>
                )}
              </div>
            ) : null}
            </div>
          </section>

          <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[11px] uppercase tracking-label text-text-muted">
                  Deliverables
                </h2>
                <p className="text-[12px] text-text-muted mt-1">
                  Define what the client receives before pricing.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addDeliverable}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                Add item
              </Button>
            </div>

            <div className="space-y-3">
              {draft.deliverables.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 border border-border/70 p-3 bg-bg-primary/30"
                >
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={`deliverable-${item.id}`} className="sr-only">
                      Deliverable {index + 1}
                    </Label>
                    <Input
                      id={`deliverable-${item.id}`}
                      value={item.description}
                      onChange={(e) =>
                        updateDeliverable(item.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="400+ edited high-resolution images"
                    />
                  </div>
                  <Tooltip label="Remove deliverable">
                    <IconButton
                      onClick={() => removeDeliverable(item.id)}
                      label={`Remove deliverable ${index + 1}`}
                      className="mt-1 hover:text-status-editing"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </IconButton>
                  </Tooltip>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[11px] uppercase tracking-label text-text-muted">
                Line items
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addLineItem}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                Add row
              </Button>
            </div>

            {activePrices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activePrices.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addFromPriceList(item)}
                    className="text-[10px] uppercase tracking-label border border-border px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                  >
                    + {item.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-text-muted">
                No active price list items.
                {FEATURES.pricing ? (
                  <>
                    {" "}
                    <Link
                      href="/dashboard/pricing"
                      className="text-text-secondary hover:text-text-primary underline"
                    >
                      Add services
                    </Link>{" "}
                    to insert them quickly.
                  </>
                ) : (
                  " Add services in the price list to insert them quickly."
                )}
              </p>
            )}

            <div className="space-y-4">
              {draft.lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-border/70 p-3 space-y-3 bg-bg-primary/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-label text-text-muted">
                      Item {index + 1}
                    </span>
                    <Tooltip label="Remove item">
                      <IconButton
                        onClick={() => removeLineItem(item.id)}
                        label={`Remove item ${index + 1}`}
                        className="hover:text-status-editing"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </IconButton>
                    </Tooltip>
                  </div>
                  <div>
                    <Label htmlFor={`desc-${item.id}`}>Description</Label>
                    <Input
                      id={`desc-${item.id}`}
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(item.id, { description: e.target.value })
                      }
                      placeholder="Wedding photography, full day coverage"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`qty-${item.id}`}>Qty</Label>
                      <Input
                        id={`qty-${item.id}`}
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) =>
                          updateLineItem(item.id, {
                            qty: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`rate-${item.id}`}>Rate (IDR)</Label>
                      <Input
                        id={`rate-${item.id}`}
                        value={
                          item.unitPrice > 0 ? String(item.unitPrice) : ""
                        }
                        onChange={(e) => {
                          const parsed = parseMoneyInput(e.target.value);
                          updateLineItem(item.id, {
                            unitPrice: parsed ?? 0,
                          });
                        }}
                        placeholder="15000000"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
            <h2 className="text-[11px] uppercase tracking-label text-text-muted">
              Notes
            </h2>
            <textarea
              value={draft.notes}
              onChange={(e) => updateDraft({ notes: e.target.value })}
              rows={3}
              placeholder="Optional scope details or personal message…"
              className="input-dark w-full min-h-[88px] resize-y"
            />
          </section>

          <section className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-4">
            <h2 className="text-[11px] uppercase tracking-label text-text-muted">
              Terms
            </h2>
            <textarea
              value={draft.terms}
              onChange={(e) => updateDraft({ terms: e.target.value })}
              rows={6}
              className="input-dark w-full min-h-[140px] resize-y text-[13px] leading-relaxed"
            />
          </section>
        </div>

        <div className="xl:sticky xl:top-[4.75rem] xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto overflow-x-auto -mx-1 px-1">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <p className="text-[10px] uppercase tracking-label text-text-muted">
              Preview
            </p>
            <p className="text-[10px] uppercase tracking-label text-text-muted">
              A4 · 210 × 297 mm
            </p>
          </div>
          <QuotationPageFrame>
            <QuotationPreview ref={pdfExportRef} draft={draft} />
          </QuotationPageFrame>
        </div>
      </div>
      {canSave || exporting ? (
        <div className="lg:hidden sticky bottom-0 -mx-4 sm:-mx-6 mt-8 border-t border-border bg-bg-primary/95 backdrop-blur px-4 sm:px-6 py-3 flex gap-2 z-30 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1"
            loading={exporting}
            onClick={() => void handleExportPdf()}
            aria-label="Export PDF"
          >
            <FileDown className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            PDF
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1"
            loading={saving}
            disabled={!canSave}
            onClick={() => void handleSave()}
            aria-label="Save quotation"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            Save
          </Button>
        </div>
      ) : null}
    </DashboardMain>
  );
}
