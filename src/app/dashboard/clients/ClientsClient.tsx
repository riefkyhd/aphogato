"use client";

import { format, parseISO } from "date-fns";
import { ArrowLeft, Pencil, Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { BackNavLink } from "@/components/BackNavLink";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormActions } from "@/components/ui/FormActions";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Tooltip } from "@/components/ui/Tooltip";
import { ClientSocialAccountsEditor } from "@/components/clients/ClientSocialAccountsEditor";
import { ClientSocialLinks } from "@/components/clients/ClientSocialLinks";
import { parseJsonResponse } from "@/lib/clients/parseJsonResponse";
import { normalizeClientSocialAccounts } from "@/lib/clients/socialAccounts";
import { useConfirmAction } from "@/lib/hooks/useConfirmAction";
import { useUndoableDelete } from "@/lib/hooks/useUndoableDelete";
import { useUnsavedChangesGuard } from "@/lib/hooks/useUnsavedChangesGuard";
import type { ClientBookEntry } from "@/lib/clients/clientBookStats";
import type { ClientSocialAccount } from "@/lib/types";

export function ClientsClient({
  initialClients,
}: {
  initialClients: ClientBookEntry[];
}) {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [clients, setClients] = useState(initialClients);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [socialAccounts, setSocialAccounts] = useState<ClientSocialAccount[]>(
    []
  );
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ClientBookEntry | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [pendingReset, setPendingReset] = useState(false);

  const confirmAction = useConfirmAction();
  const undoableDelete = useUndoableDelete();

  const editingSnapshotRef = useRef<string>("");

  const currentSnapshot = JSON.stringify({
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    notes: notes.trim(),
    socialAccounts,
  });
  const dirty = editing
    ? currentSnapshot !== editingSnapshotRef.current
    : Boolean(
        name.trim() ||
          phone.trim() ||
          email.trim() ||
          notes.trim() ||
          socialAccounts.length
      );

  useUnsavedChangesGuard(
    dirty,
    "You have unsaved client details. Leave this page?"
  );

  const resetForm = useCallback(() => {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setSocialAccounts([]);
    setEditing(null);
    setNameError(null);
    editingSnapshotRef.current = "";
  }, []);

  const requestReset = useCallback(() => {
    if (!dirty) {
      resetForm();
      return;
    }
    confirmAction.request({
      title: "Discard changes?",
      description:
        "Any unsaved details in the form will be lost. Continue?",
      confirmLabel: "Discard",
      destructive: true,
      run: () => resetForm(),
    });
  }, [dirty, resetForm, confirmAction]);

  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  useEffect(() => {
    if (pendingReset) {
      resetForm();
      setPendingReset(false);
    }
  }, [pendingReset, resetForm]);

  const refreshClients = useCallback(() => {
    router.refresh();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Enter a client name.");
      nameInputRef.current?.focus();
      return;
    }
    setNameError(null);
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
          social_accounts: socialAccounts,
        }),
      });
      const json = await parseJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(json.error ?? "Failed to save client");
      toast.success(editing ? "Client updated" : "Client added");
      resetForm();
      refreshClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(client: ClientBookEntry) {
    if (dirty && !editing) {
      confirmAction.request({
        title: "Discard new client?",
        description:
          "You have unsaved details for a new client. Discard and edit this one?",
        confirmLabel: "Discard and edit",
        destructive: true,
        run: () => applyEdit(client),
      });
      return;
    }
    applyEdit(client);
  }

  function applyEdit(client: ClientBookEntry) {
    setEditing(client);
    setName(client.name);
    setPhone(client.phone ?? "");
    setEmail(client.email ?? "");
    setNotes(client.notes ?? "");
    setNameError(null);
    const accounts = normalizeClientSocialAccounts(client.social_accounts);
    setSocialAccounts(accounts);
    editingSnapshotRef.current = JSON.stringify({
      name: client.name,
      phone: client.phone ?? "",
      email: client.email ?? "",
      notes: client.notes ?? "",
      socialAccounts: accounts,
    });
  }

  function focusNewClient() {
    resetForm();
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }

  function requestDelete(client: ClientBookEntry) {
    confirmAction.request({
      title: "Remove client?",
      description: `${client.name} will be removed from the client book. You'll have 5 seconds to undo.`,
      confirmLabel: "Remove client",
      destructive: true,
      run: () => performUndoableDelete(client),
    });
  }

  function performUndoableDelete(client: ClientBookEntry) {
    const previous = clients;
    undoableDelete.trigger({
      message: `Removed ${client.name}`,
      optimisticRemove: () => {
        setClients((rows) => rows.filter((row) => row.id !== client.id));
        if (editing?.id === client.id) setPendingReset(true);
      },
      restore: () => setClients(previous),
      commit: async () => {
        const res = await fetch(`/api/clients/${client.id}`, {
          method: "DELETE",
        });
        const json = await parseJsonResponse<{ error?: string }>(res);
        if (!res.ok) throw new Error(json.error ?? "Failed to delete");
        refreshClients();
      },
    });
  }

  return (
    <DashboardMain>
      <ConfirmDialog
        open={confirmAction.open}
        title={confirmAction.title}
        description={confirmAction.description}
        confirmLabel={confirmAction.confirmLabel}
        destructive={confirmAction.destructive}
        confirming={confirmAction.confirming}
        onClose={confirmAction.close}
        onConfirm={confirmAction.confirm}
      />
      <BackNavLink
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Home
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
        <form
          onSubmit={handleSubmit}
          className="space-y-4 border border-border bg-bg-secondary p-4 sm:p-5 h-fit"
        >
          <h2 className="text-[11px] uppercase tracking-label text-text-muted">
            {editing ? "Edit client" : "Add client"}
          </h2>
          <div>
            <Label htmlFor="client-name">Name</Label>
            <Input
              id="client-name"
              ref={nameInputRef}
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError && e.target.value.trim()) setNameError(null);
              }}
              placeholder="Salma"
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? "client-name-error" : undefined}
              className={
                nameError
                  ? "!border-status-editing focus:!border-status-editing"
                  : undefined
              }
            />
            {nameError ? (
              <p
                id="client-name-error"
                className="mt-1 text-[11px] uppercase tracking-label text-status-editing"
              >
                {nameError}
              </p>
            ) : null}
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
          <ClientSocialAccountsEditor
            accounts={socialAccounts}
            onChange={setSocialAccounts}
          />
          <FormActions>
            {editing || dirty ? (
              <Button type="button" variant="secondary" onClick={requestReset}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Add client"}
            </Button>
          </FormActions>
        </form>

        <section>
          <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-3">
            {clients.length} client{clients.length === 1 ? "" : "s"}
          </h2>
          {clients.length === 0 ? (
            <div className="border border-dashed border-border p-8 text-center">
              <UserPlus
                className="h-8 w-8 mx-auto text-text-muted mb-3"
                aria-hidden
              />
              <p className="text-[14px] text-text-primary">No clients yet</p>
              <p className="mt-2 text-[13px] text-text-secondary leading-relaxed max-w-sm mx-auto">
                Add your first client to speed up quotes, calendar events, and
                gallery invites.
              </p>
              <Button
                type="button"
                className="mt-5"
                onClick={focusNewClient}
              >
                Add first client
              </Button>
            </div>
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
                    <ClientSocialLinks accounts={client.social_accounts} />
                    {client.notes && (
                      <p className="mt-1 text-[12px] text-text-muted">
                        {client.notes}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] uppercase tracking-label text-text-muted">
                      {client.projectCount} galler
                      {client.projectCount === 1 ? "y" : "ies"}
                      {client.lastEventDate
                        ? ` · Last shoot ${format(parseISO(client.lastEventDate), "MMM d, yyyy")}`
                        : ""}
                      {" · Added "}
                      {format(parseISO(client.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <Tooltip label="Edit client">
                      <IconButton
                        onClick={() => startEdit(client)}
                        label="Edit client"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </IconButton>
                    </Tooltip>
                    <Tooltip label="Remove client">
                      <IconButton
                        onClick={() => requestDelete(client)}
                        label="Remove client"
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
