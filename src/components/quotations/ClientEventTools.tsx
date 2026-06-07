"use client";

import { ClipboardCopy, ClipboardPaste } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  buildClientEventClipboard,
  parseClientEventText,
} from "@/lib/quotations/clientEventTemplate";
import type { QuotationDraft } from "@/lib/quotations/types";

export function ClientEventTools({
  onApply,
}: {
  onApply: (patch: Partial<QuotationDraft>) => void;
}) {
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const handleCopy = async () => {
    const text = buildClientEventClipboard();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Template copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleImport = () => {
    const parsed = parseClientEventText(importText);
    const keys = Object.keys(parsed);

    if (keys.length === 0) {
      toast.error("No recognized fields found. Use the copied template format.");
      return;
    }

    onApply(parsed);
    setImportText("");
    setImportOpen(false);
    toast.success("Client and event fields updated");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => void handleCopy()}>
          <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" aria-hidden />
          Copy template
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setImportOpen((open) => !open)}
        >
          <ClipboardPaste className="h-3.5 w-3.5 mr-1.5" aria-hidden />
          Import paste
        </Button>
      </div>

      {importOpen ? (
        <div className="space-y-2 border border-border/70 bg-bg-primary/30 p-3">
          <p className="text-[12px] text-text-muted leading-relaxed">
            Paste the client reply using the same format as the copied template.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            placeholder={`Nama: Andrew & Katherine\nNo. HP: +62 812 3456 7890\nInstagram: @andrew\n\nNama acara: Wedding\nTanggal acara (DD/MM/YY): 15/06/26\nDurasi: 8 jam\nLokasi: Hotel Mulia, Jakarta`}
            className="input-dark w-full min-h-[160px] resize-y text-[13px] leading-relaxed"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleImport}>
              Apply to form
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setImportText("");
                setImportOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
