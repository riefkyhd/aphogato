"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function GoogleCalendarSettings({
  isConnected: initialConnected,
}: {
  isConnected: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConnected = initialConnected;

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      toast.success("Google Calendar connected");
      router.replace("/dashboard/settings");
    }
    const err = searchParams.get("error");
    if (err) {
      toast.error(decodeURIComponent(err));
      router.replace("/dashboard/settings");
    }
  }, [searchParams, router]);

  async function handleDisconnect() {
    try {
      const res = await fetch("/api/calendar/settings", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to disconnect");
        return;
      }
      toast.success("Google Calendar disconnected");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect"
      );
    }
  }

  return (
    <section className="border border-border bg-bg-secondary p-6 max-w-lg">
      <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
        Google Calendar
      </h2>
      {isConnected ? (
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-label text-status-delivered flex items-center gap-2">
            <span className="inline-block h-[6px] w-[6px] rounded-full bg-status-delivered" />
            Connected
          </p>
          <Button type="button" variant="secondary" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] text-text-secondary">
            Connect your Google account to sync shoot events to your primary
            calendar.
          </p>
          <Button
            type="button"
            onClick={() => {
              window.location.href = "/api/auth/google";
            }}
          >
            Connect Google Calendar
          </Button>
        </div>
      )}
    </section>
  );
}
