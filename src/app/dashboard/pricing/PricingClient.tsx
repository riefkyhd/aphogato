"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  FileDown,
  FileText,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { BackNavLink } from "@/components/BackNavLink";
import { SalesSectionNav } from "@/components/sales/SalesSectionNav";
import { Button } from "@/components/ui/Button";
import { FormActions } from "@/components/ui/FormActions";
import {
  PageToolbarActions,
  toolbarButtonClass,
} from "@/components/ui/PageToolbarActions";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatMoney, parseMoneyInput } from "@/lib/finance/formatMoney";
import { FEATURES } from "@/lib/features";
import {
  downloadPriceListCsv,
  exportPriceListPdf,
  formatPriceListCsv,
} from "@/lib/pricing/exportPriceList";
import type { PriceListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PricingClient({
  initialItems,
}: {
  initialItems: PriceListItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PriceListItem | null>(null);
  const [exporting, setExporting] = useState(false);

  const resetForm = () => {
    setName("");
    setAmount("");
    setCategory("");
    setNotes("");
    setEditing(null);
  };

  const reload = useCallback(async () => {
    const res = await fetch("/api/pricing");
    const json = await res.json();
    if (res.ok && Array.isArray(json)) {
      setItems(json as PriceListItem[]);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedAmount = parseMoneyInput(amount);
    if (!trimmedName || parsedAmount === null) return;
    setSaving(true);
    try {
      const url = editing ? `/api/pricing/${editing.id}` : "/api/pricing";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          amount: parsedAmount,
          category: category.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save item");
      toast.success(editing ? "Item updated" : "Item added");
      resetForm();
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: PriceListItem) {
    setEditing(item);
    setName(item.name);
    setAmount(String(item.amount));
    setCategory(item.category ?? "");
    setNotes(item.notes ?? "");
  }

  async function removeItem(item: PriceListItem) {
    if (!window.confirm(`Remove "${item.name}" from the price list?`)) return;
    try {
      const res = await fetch(`/api/pricing/${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete");
      toast.success("Item removed");
      if (editing?.id === item.id) resetForm();
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function moveItem(item: PriceListItem, direction: -1 | 1) {
    const idx = items.findIndex((i) => i.id === item.id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;

    const other = items[swapIdx];
    const itemOrder = item.sort_order;
    const otherOrder = other.sort_order;

    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...other, sort_order: itemOrder };
      next[swapIdx] = { ...item, sort_order: otherOrder };
      return next.sort((a, b) => a.sort_order - b.sort_order);
    });

    try {
      await Promise.all([
        fetch(`/api/pricing/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: otherOrder }),
        }),
        fetch(`/api/pricing/${other.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: itemOrder }),
        }),
      ]);
    } catch {
      await reload();
      toast.error("Failed to reorder");
    }
  }

  async function toggleActive(item: PriceListItem) {
    const next = !item.active;
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, active: next } : row))
    );
    try {
      const res = await fetch(`/api/pricing/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update");
    } catch (err) {
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, active: item.active } : row
        )
      );
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  function handleExportCsv() {
    const csv = formatPriceListCsv(items);
    downloadPriceListCsv(csv);
    toast.success("Price list CSV downloaded");
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      await exportPriceListPdf(items);
      toast.success("Price list PDF downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const activeCount = items.filter((i) => i.active).length;

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
              Price list
            </h1>
            <p className="mt-2 text-[13px] text-text-secondary max-w-2xl">
              Studio services and rates. Export as CSV or PDF to share with
              clients.
            </p>
          </div>
          <PageToolbarActions>
            {FEATURES.quotations ? (
            <Tooltip label="Create client quotation">
              <Link
                href="/dashboard/quotations"
                className={cn(
                  "btn-secondary !text-[11px] !min-h-9 !px-3 !py-2 inline-flex items-center justify-center gap-1.5",
                  toolbarButtonClass
                )}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Quotation
              </Link>
            </Tooltip>
            ) : null}
            {FEATURES.invoices ? (
            <Tooltip label="Final payment invoice">
              <Link
                href="/dashboard/invoices"
                className={cn(
                  "btn-secondary !text-[11px] !min-h-9 !px-3 !py-2 inline-flex items-center justify-center gap-1.5",
                  toolbarButtonClass
                )}
              >
                <Receipt className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Invoice
              </Link>
            </Tooltip>
            ) : null}
            <Tooltip label="Export as CSV">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={toolbarButtonClass}
                onClick={handleExportCsv}
                disabled={activeCount === 0}
                aria-label="Export CSV"
              >
                <FileDown className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                CSV
              </Button>
            </Tooltip>
            <Tooltip label="Export as PDF">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={toolbarButtonClass}
                loading={exporting}
                onClick={() => void handleExportPdf()}
                disabled={activeCount === 0}
                aria-label="Export PDF"
              >
                <FileDown className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                PDF
              </Button>
            </Tooltip>
          </PageToolbarActions>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 border border-border bg-bg-secondary p-4 sm:p-5 h-fit"
        >
          <h2 className="text-[11px] uppercase tracking-label text-text-muted">
            {editing ? "Edit item" : "Add item"}
          </h2>
          <div>
            <Label htmlFor="price-name">Service</Label>
            <Input
              id="price-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wedding full day"
            />
          </div>
          <div>
            <Label htmlFor="price-amount">Price (IDR)</Label>
            <Input
              id="price-amount"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="15.000.000"
              inputMode="numeric"
            />
          </div>
          <div>
            <Label htmlFor="price-category">Category</Label>
            <Input
              id="price-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Wedding, portrait…"
            />
          </div>
          <div>
            <Label htmlFor="price-notes">Notes</Label>
            <Input
              id="price-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Includes 400 edited photos…"
            />
          </div>
          <FormActions>
            {editing && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={saving}>
              {editing ? (
                "Save changes"
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden />
                  Add item
                </>
              )}
            </Button>
          </FormActions>
        </form>

        <section>
          <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-3">
            {activeCount} active · {items.length} total
          </h2>
          {items.length === 0 ? (
            <p className="text-[13px] text-text-secondary">
              No price list items yet. Add your studio rates above.
            </p>
          ) : (
            <ul className="divide-y divide-border border border-border">
              {items.map((item, idx) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-start justify-between gap-3 p-4 hover:bg-bg-secondary/50",
                    !item.active && "opacity-50"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="text-[14px] text-text-primary">{item.name}</p>
                      <p className="text-[13px] text-text-secondary tabular-nums">
                        {formatMoney(item.amount)}
                      </p>
                    </div>
                    {item.category && (
                      <p className="mt-1 text-[11px] uppercase tracking-label text-text-muted">
                        {item.category}
                      </p>
                    )}
                    {item.notes && (
                      <p className="mt-1 text-[12px] text-text-muted">{item.notes}</p>
                    )}
                    <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={() => void toggleActive(item)}
                        className="accent-text-primary"
                      />
                      Active on exports
                    </label>
                  </div>
                  <div className="flex shrink-0">
                    <Tooltip label="Move up">
                      <IconButton
                        disabled={idx === 0}
                        onClick={() => void moveItem(item, -1)}
                        label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden />
                      </IconButton>
                    </Tooltip>
                    <Tooltip label="Move down">
                      <IconButton
                        disabled={idx === items.length - 1}
                        onClick={() => void moveItem(item, 1)}
                        label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden />
                      </IconButton>
                    </Tooltip>
                    <Tooltip label="Edit item">
                      <IconButton
                        onClick={() => startEdit(item)}
                        label="Edit item"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </IconButton>
                    </Tooltip>
                    <Tooltip label="Remove item">
                      <IconButton
                        onClick={() => void removeItem(item)}
                        label="Remove item"
                        className="hover:text-status-editing"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </IconButton>
                    </Tooltip>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardMain>
  );
}
