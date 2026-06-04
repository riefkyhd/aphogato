"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  isBrowserReminderEnabled,
  setBrowserReminderEnabled,
} from "@/lib/calendar/todayEvents";

export function TodayReminderSettings() {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );

  useEffect(() => {
    setEnabled(isBrowserReminderEnabled());
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  async function handleToggle() {
    if (permission === "unsupported") {
      toast.error("Browser notifications are not supported here");
      return;
    }

    if (!enabled) {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error("Allow notifications in your browser to enable daily reminders");
        return;
      }
      setBrowserReminderEnabled(true);
      setEnabled(true);
      toast.success(
        "You’ll get a browser alert when you open the dashboard on days with shoots scheduled"
      );
    } else {
      setBrowserReminderEnabled(false);
      setEnabled(false);
      toast.success("Browser reminders turned off");
    }
  }

  return (
    <section className="border border-border bg-bg-secondary p-6 max-w-lg mt-6">
      <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
        Today&apos;s shoots
      </h2>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
        A banner appears on the dashboard when you have shoots scheduled for
        today. Optionally enable a browser notification each time you open the
        dashboard on a day with scheduled shoots.
      </p>
      {permission === "unsupported" ? (
        <p className="text-[12px] text-text-muted">
          Browser notifications are not available in this environment.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-label text-text-muted">
            Status:{" "}
            <span className="text-text-secondary">
              {enabled && permission === "granted"
                ? "Browser alerts on"
                : "Banner only"}
            </span>
          </p>
          <Button
            type="button"
            variant={enabled ? "secondary" : "primary"}
            className="!text-[11px]"
            onClick={handleToggle}
          >
            {enabled ? "Turn off browser alerts" : "Enable browser alerts"}
          </Button>
        </div>
      )}
    </section>
  );
}
