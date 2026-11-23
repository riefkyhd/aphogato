"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Camera,
  CheckSquare,
  Download,
  Square,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  SocialScheduleCard,
  type SocialGraphicFormat,
} from "@/components/calendar/SocialScheduleCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import type { CalendarEvent } from "@/lib/types";

export interface ExportSocialModalProps {
  open: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  defaultMonth?: Date;
}

export function ExportSocialModal({
  open,
  onClose,
  events,
  defaultMonth,
}: ExportSocialModalProps) {
  useBodyScrollLock(open);

  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // 1. Controls State
  const [formatType, setFormatType] = useState<SocialGraphicFormat>("story");
  const initialMonthName = defaultMonth
    ? format(defaultMonth, "MMMM yyyy")
    : events[0]
      ? format(parseISO(events[0].shoot_date), "MMMM yyyy")
      : "Upcoming";
  const [headline, setHeadline] = useState(`${initialMonthName} Schedule`);
  const [maskClientNames, setMaskClientNames] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [includeServices, setIncludeServices] = useState(true);

  // 2. Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Default to events from the active month or first 8 events
    if (defaultMonth) {
      const monthPrefix = format(defaultMonth, "yyyy-MM");
      const monthMatches = events.filter((e) =>
        e.shoot_date.startsWith(monthPrefix)
      );
      if (monthMatches.length > 0) {
        return new Set(monthMatches.slice(0, 8).map((e) => e.id));
      }
    }
    return new Set(events.slice(0, 8).map((e) => e.id));
  });

  // Re-sync default selection when opening modal
  useEffect(() => {
    if (!open) return;
    if (defaultMonth) {
      const monthPrefix = format(defaultMonth, "yyyy-MM");
      const monthMatches = events.filter((e) =>
        e.shoot_date.startsWith(monthPrefix)
      );
      if (monthMatches.length > 0) {
        setSelectedIds(new Set(monthMatches.slice(0, 8).map((e) => e.id)));
        setHeadline(`${format(defaultMonth, "MMMM yyyy")} Schedule`);
        return;
      }
    }
    setSelectedIds(new Set(events.slice(0, 8).map((e) => e.id)));
  }, [open, defaultMonth, events]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !downloading) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, downloading, onClose]);

  const sortedAllEvents = useMemo(
    () => [...events].sort((a, b) => a.shoot_date.localeCompare(b.shoot_date)),
    [events]
  );

  const selectedEvents = useMemo(
    () => sortedAllEvents.filter((e) => selectedIds.has(e.id)),
    [sortedAllEvents, selectedIds]
  );

  // Month groupings for filter tabs
  const monthsInEvents = useMemo(() => {
    const set = new Set<string>();
    for (const ev of sortedAllEvents) {
      set.add(format(parseISO(ev.shoot_date), "yyyy-MM"));
    }
    return Array.from(set).sort();
  }, [sortedAllEvents]);

  const selectMonth = useCallback(
    (monthPrefix: string) => {
      const monthMatches = sortedAllEvents.filter((e) =>
        e.shoot_date.startsWith(monthPrefix)
      );
      setSelectedIds(new Set(monthMatches.map((e) => e.id)));
      if (monthMatches.length > 0) {
        setHeadline(`${format(parseISO(monthMatches[0].shoot_date), "MMMM yyyy")} Schedule`);
      }
    },
    [sortedAllEvents]
  );

  const toggleEvent = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(sortedAllEvents.map((e) => e.id)));
  }, [sortedAllEvents]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 3. Export PNG Handler via html2canvas
  const handleDownload = useCallback(async () => {
    const target = cardRef.current;
    if (!target) {
      toast.error("Graphic preview not ready");
      return;
    }

    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(target, {
        scale: 1, // base element is already 1080px wide
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0C0C0D",
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      const filename = `schedule-${formatType}-${format(new Date(), "yyyy-MM-dd")}.png`;
      a.download = filename;
      a.click();
      toast.success("Social schedule graphic downloaded");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export graphic"
      );
    } finally {
      setDownloading(false);
    }
  }, [formatType]);

  if (!open) return null;

  // Responsive scale factor for live preview column
  const previewScale = formatType === "story" ? 0.36 : 0.42;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-social-title"
    >
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col border border-border bg-bg-elevated shadow-2xl overflow-hidden rounded-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-secondary">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-sm bg-text-primary text-bg-primary flex items-center justify-center">
              <Camera className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h2
                id="export-social-title"
                className="text-sm font-medium uppercase tracking-[0.05em] text-text-primary"
              >
                Export Social Media Graphic
              </h2>
              <p className="text-[11px] text-text-muted">
                Create a high-resolution schedule card for Instagram Stories or Feed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={downloading}
            className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body: Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Controls Column */}
          <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(92vh-130px)]">
            {/* Format Switcher */}
            <div>
              <Label className="text-[11px] uppercase tracking-label text-text-muted mb-2 block">
                Aspect Ratio Preset
              </Label>
              <SegmentedControl
                value={formatType}
                aria-label="Format preset"
                options={[
                  { value: "story", label: "Story (9:16 • 1080×1920)" },
                  { value: "feed", label: "Feed (4:5 • 1080×1350)" },
                ]}
                onChange={(val) => setFormatType(val as SocialGraphicFormat)}
              />
            </div>

            {/* Headline Input */}
            <div>
              <Label
                htmlFor="graphic-headline"
                className="text-[11px] uppercase tracking-label text-text-muted mb-2 block"
              >
                Graphic Title
              </Label>
              <Input
                id="graphic-headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. December 2026 Availability"
                className="text-sm"
              />
            </div>

            {/* Privacy & Display Toggles */}
            <div className="border border-border p-4 bg-bg-secondary/40 space-y-3">
              <span className="text-[11px] uppercase tracking-label text-text-muted block font-medium">
                Privacy & Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary">
                  <input
                    type="checkbox"
                    checked={maskClientNames}
                    onChange={(e) => setMaskClientNames(e.target.checked)}
                    className="rounded-sm border-border text-text-primary focus:ring-0"
                  />
                  <span>Mask Clients (Booked)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary">
                  <input
                    type="checkbox"
                    checked={includeLocation}
                    onChange={(e) => setIncludeLocation(e.target.checked)}
                    className="rounded-sm border-border text-text-primary focus:ring-0"
                  />
                  <span>Show Location</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary">
                  <input
                    type="checkbox"
                    checked={includeServices}
                    onChange={(e) => setIncludeServices(e.target.checked)}
                    className="rounded-sm border-border text-text-primary focus:ring-0"
                  />
                  <span>Show Services</span>
                </label>
              </div>
            </div>

            {/* Event Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-label text-text-muted font-medium">
                  Select Shoots ({selectedIds.size} of {sortedAllEvents.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[11px] text-text-secondary hover:text-text-primary uppercase tracking-label underline"
                  >
                    Select All
                  </button>
                  <span className="text-text-muted">•</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-[11px] text-text-secondary hover:text-text-primary uppercase tracking-label underline"
                  >
                    Deselect
                  </button>
                </div>
              </div>

              {/* Month Quick Filters */}
              {monthsInEvents.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {monthsInEvents.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectMonth(m)}
                      className="px-2 py-0.5 border border-border text-[10px] uppercase tracking-label text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                    >
                      {format(parseISO(`${m}-01`), "MMM yyyy")}
                    </button>
                  ))}
                </div>
              )}

              {/* Event Checklist */}
              <div className="border border-border divide-y divide-border max-h-[260px] overflow-y-auto bg-bg-secondary/20">
                {sortedAllEvents.map((ev) => {
                  const isChecked = selectedIds.has(ev.id);
                  const parsed = parseISO(ev.shoot_date);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => toggleEvent(ev.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-bg-primary/40 hover:bg-bg-primary/60"
                          : "opacity-60 hover:opacity-100 hover:bg-bg-secondary/50"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 shrink-0 text-text-primary" />
                      ) : (
                        <Square className="h-4 w-4 shrink-0 text-text-muted" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-medium text-text-primary truncate">
                            {ev.title}
                          </p>
                          <span className="text-[10px] text-text-muted shrink-0 tabular-nums">
                            {format(parsed, "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary truncate mt-0.5">
                          {ev.client_name?.trim() || "Private"} •{" "}
                          {ev.location?.trim() || "No location"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Preview Column */}
          <div className="p-6 bg-bg-primary/50 flex flex-col items-center justify-between min-w-[420px] max-w-[490px] overflow-hidden">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-label text-text-muted">
                Live Preview
              </span>
              <span className="text-[11px] text-text-muted uppercase">
                {formatType === "story" ? "1080×1920 (9:16)" : "1080×1350 (4:5)"}
              </span>
            </div>

            {/* Scaled Preview Frame */}
            <div className="border border-border/60 shadow-xl overflow-hidden my-auto flex items-center justify-center bg-black">
              <SocialScheduleCard
                ref={cardRef}
                events={selectedEvents}
                headline={headline}
                format={formatType}
                maskClientNames={maskClientNames}
                includeLocation={includeLocation}
                includeServices={includeServices}
                scale={previewScale}
              />
            </div>

            {/* Action Button */}
            <div className="w-full mt-6 pt-4 border-t border-border">
              <Button
                type="button"
                className="w-full !min-h-[44px] uppercase tracking-label font-medium"
                loading={downloading}
                disabled={downloading || selectedEvents.length === 0}
                onClick={() => void handleDownload()}
              >
                <Download className="h-4 w-4 mr-2" aria-hidden />
                Download PNG Graphic
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
