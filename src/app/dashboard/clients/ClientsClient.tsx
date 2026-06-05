"use client";

import { format, parseISO } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { BackNavLink } from "@/components/BackNavLink";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Client } from "@/lib/types";

export function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState(initialClients);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setEditing(null);
  };

  const reload = useCallback(async () => {
    const res = await fetch("/api/clients");
    const json = await res.json();
    if (res.ok && Array.isArray(json)) {
      setClients(json as Client[]);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      const url = editing ? `/api/clients/${editing.id}` : "/api/clients";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: phone.trim() || null,
          email: email.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save client");
      toast.success(editing ? "Client updated" : "Client added");
      resetForm();
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(client: Client) {
    setEditing(client);
    setName(client.name);
    setPhone(client.phone ?? "");
    setEmail(client.email ?? "");
    setNotes(client.notes ?? "");
  }

  async function removeClient(client: Client) {
    if (!window.confirm(`Remove ${client.name} from the client book?`)) return;
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete");
      toast.success("Client removed");
      if (editing?.id === client.id) resetForm();
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <main className="px-4 sm:px-6 md:px-10 py-6 sm:py-10">
      <BackNavLink
        href="/dashboard"
        className="inline-block text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary mb-6"
      >
        ← All projects
      </BackNavLink>

      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase">
          Client book
        </h1>
        <p className="mt-2 text-[13px] text-text-secondary max-w-2xl">
          Saved client names for projects, calendar, and finance. New projects
          and calendar events auto-add names here (deduped by name).
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8">
        <form onSubmit={handleSubmit} className="space-y-4 border border-border p-4 sm:p-5">
          <h2 className="text-[11px] uppercase tracking-label text-text-muted">
            {editing ? "Edit client" : "Add client"}
          </h2>
          <div>
            <Label htmlFor="client-name">Name</Label>
            <Input
              id="client-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Salma"
            />
          </div>
          <div>
            <Label htmlFor="client-phone">Phone</Label>
            <Input
              id="client-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+62 …"
            />
          </div>
          <div>
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@email.com"
            />
          </div>
          <div>
            <Label htmlFor="client-notes">Notes</Label>
            <Input
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referral, preferences…"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Add client"}
            </Button>
            {editing && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <section>
          <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-3">
            {clients.length} client{clients.length === 1 ? "" : "s"}
          </h2>
          {clients.length === 0 ? (
            <p className="text-[13px] text-text-secondary">
              No clients yet. Create a project or add one above.
            </p>
          ) : (
            <ul className="divide-y divide-border border border-border">
              {clients.map((client) => (
                <li
                  key={client.id}
                  className="flex items-start justify-between gap-3 p-4 hover:bg-bg-secondary/50"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] text-text-primary">{client.name}</p>
                    {(client.phone || client.email) && (
                      <p className="mt-1 text-[12px] text-text-secondary">
                        {[client.phone, client.email].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {client.notes && (
                      <p className="mt-1 text-[12px] text-text-muted">
                        {client.notes}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] uppercase tracking-label text-text-muted">
                      Added {format(parseISO(client.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Tooltip label="Edit client">
                      <button
                        type="button"
                        onClick={() => startEdit(client)}
                        className="p-2 text-text-muted hover:text-text-primary"
                        aria-label="Edit client"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                    </Tooltip>
                    <Tooltip label="Remove client">
                      <button
                        type="button"
                        onClick={() => void removeClient(client)}
                        className="p-2 text-text-muted hover:text-status-editing"
                        aria-label="Remove client"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </Tooltip>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
