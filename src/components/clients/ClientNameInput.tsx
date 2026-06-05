"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { Client } from "@/lib/types";

export function ClientNameInput({
  id = "client",
  label = "Client name",
  value,
  onChange,
  placeholder = "Salma",
  required = false,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const listId = `${id}-suggestions`;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/clients");
        const json = await res.json();
        if (!cancelled && res.ok && Array.isArray(json)) {
          setClients(json as Client[]);
        }
      } catch {
        // ignore — free text still works
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => clients.map((c) => c.name), [clients]);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        list={listId}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <datalist id={listId}>
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}
