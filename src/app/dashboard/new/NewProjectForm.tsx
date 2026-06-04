"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type CreatePhase = "idle" | "creating" | "opening";

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
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
      <div>
        <Label htmlFor="client">Client name</Label>
        <Input
          id="client"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Salma"
        />
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
