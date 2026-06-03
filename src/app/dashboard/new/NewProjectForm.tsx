"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [folder, setFolder] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          client_name: clientName,
          cloudinary_folder: folder,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create project");
        return;
      }
      toast.success(`Imported ${json.photo_count} photos`);
      router.push(`/dashboard/${json.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bali wedding — Putri &amp; Andre"
        />
      </div>
      <div>
        <Label htmlFor="client">Client name</Label>
        <Input
          id="client"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Putri"
        />
      </div>
      <div>
        <Label htmlFor="folder">Cloudinary folder path</Label>
        <Input
          id="folder"
          required
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder="weddings/2026/putri-andre"
        />
        <p className="mt-2 text-[12px] text-text-muted">
          Media Library folder name (e.g. Katherine) or classic path prefix
          (e.g. weddings/client). No leading slash.
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Importing from Cloudinary…" : "Create project"}
      </Button>
    </form>
  );
}
