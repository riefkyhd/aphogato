"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function DataExportSettings() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aphogato-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <h3 className="text-[12px] uppercase tracking-label text-text-muted mb-2">
        Export all data
      </h3>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-3 max-w-xl">
        Download a JSON snapshot of your clients, projects, quotations,
        calendar events, income, and expenses. Use it as a personal backup
        or to move data between environments.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={exporting}
        onClick={() => void handleExport()}
      >
        <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden />
        Download export
      </Button>
    </div>
  );
}
