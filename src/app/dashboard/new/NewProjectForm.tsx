"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";
import { ClientNameInput } from "@/components/clients/ClientNameInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { DEFAULT_MAX_PHOTO_SELECTION } from "@/lib/photoSelectionLimit";

type CreatePhase = "idle" | "creating" | "opening";

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [maxSelection, setMaxSelection] = useState(
    String(DEFAULT_MAX_PHOTO_SELECTION)
  );
  const [phase, setPhase] = useState<CreatePhase>("idle");

  const busy = phase !== "idle";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("creating");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          client_name: clientName,
          max_photo_selection: Number(maxSelection),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create project");
        setPhase("idle");
        return;
      }
      toast.success("Project created");
      setPhase("opening");
      router.push(`/dashboard/${json.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
      setPhase("idle");
    }
  }

  return (
    <>
      {phase === "opening" && (
        <PageLoadingOverlay message="Opening your new project…" />
      )}
    <form onSubmit={handleSubmit} className="space-y-6" aria-busy={busy}>
      <div>
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Wedding — Derio &amp; Salma"
        />
      </div>
      <ClientNameInput
        id="client"
        value={clientName}
        onChange={setClientName}
      />
      <div>
        <Label htmlFor="max-selection">Max photos client can select</Label>
        <Input
          id="max-selection"
          type="number"
          min={1}
          max={999}
          required
          value={maxSelection}
          onChange={(e) => setMaxSelection(e.target.value)}
        />
        <p className="mt-2 text-[12px] text-text-muted leading-relaxed">
          Each project has its own limit. You can change it later on the project
          page.
        </p>
      </div>
      <Button type="submit" loading={busy} disabled={busy}>
        {phase === "creating"
          ? "Creating…"
          : phase === "opening"
            ? "Opening project…"
            : "Create project"}
      </Button>
    </form>
    </>
  );
}
