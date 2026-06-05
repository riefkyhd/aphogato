"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tooltip } from "@/components/ui/Tooltip";
import type { DeliverableItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DeliverablesChecklist({
  projectId,
  eventId,
  compact = false,
}: {
  projectId?: string;
  eventId?: string;
  compact?: boolean;
}) {
  const [items, setItems] = useState<DeliverableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const queryKey = projectId
    ? `project_id=${projectId}`
    : eventId
      ? `event_id=${eventId}`
      : null;

  const load = useCallback(async () => {
    if (!queryKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/deliverables?${queryKey}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load deliverables");
      setItems(Array.isArray(json) ? json : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || !queryKey) return;
    setAdding(true);
    try {
      const res = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          project_id: projectId ?? null,
          event_id: eventId ?? null,
          sort_order: items.length,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add item");
      setItems((prev) => [...prev, json as DeliverableItem]);
      setNewTitle("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  }

  async function toggleDone(item: DeliverableItem) {
    const next = !item.done;
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, done: next } : row))
    );
    try {
      const res = await fetch(`/api/deliverables/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update");
    } catch (err) {
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, done: item.done } : row
        )
      );
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function removeItem(item: DeliverableItem) {
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    try {
      const res = await fetch(`/api/deliverables/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete");
    } catch (err) {
      void load();
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className={cn(compact ? "space-y-2" : "space-y-3")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-label text-text-muted">
          Deliverables
        </p>
        {items.length > 0 && (
          <span className="text-[11px] text-text-muted tabular-nums">
            {doneCount}/{items.length} done
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-[12px] text-text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[12px] text-text-secondary">
          Track edits, exports, and handoffs for this shoot.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 group"
            >
              <Tooltip label={item.done ? "Mark not done" : "Mark done"}>
                <button
                  type="button"
                  onClick={() => void toggleDone(item)}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center border transition-colors",
                    item.done
                      ? "border-status-delivered bg-status-delivered/10 text-status-delivered"
                      : "border-border text-text-muted hover:border-text-secondary hover:text-text-primary"
                  )}
                  aria-label={item.done ? "Mark not done" : "Mark done"}
                >
                  {item.done && <Check className="h-3.5 w-3.5" aria-hidden />}
                </button>
              </Tooltip>
              <span
                className={cn(
                  "flex-1 text-[13px] leading-snug",
                  item.done
                    ? "text-text-muted line-through"
                    : "text-text-primary"
                )}
              >
                {item.title}
              </span>
              <Tooltip label="Remove item">
                <button
                  type="button"
                  onClick={() => void removeItem(item)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-text-muted hover:text-status-editing transition-opacity"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addItem} className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add deliverable…"
          className="flex-1 !text-[13px]"
          aria-label="New deliverable"
        />
        <Tooltip label="Add deliverable">
          <Button
            type="submit"
            variant="secondary"
            className="!px-3 shrink-0"
            loading={adding}
            disabled={!newTitle.trim()}
            aria-label="Add deliverable"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
        </Tooltip>
      </form>
    </div>
  );
}
