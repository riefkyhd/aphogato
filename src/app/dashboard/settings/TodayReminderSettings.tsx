"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserPreferencesContext } from "@/components/preferences/UserPreferencesProvider";
import { Button } from "@/components/ui/Button";

export function TodayReminderSettings() {
  const { preferences, saving, updatePreferences } = useUserPreferencesContext();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );

  useEffect(() => {
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

    if (!preferences.browserReminderEnabled) {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error("Allow notifications in your browser to enable daily reminders");
        return;
      }
      try {
        await updatePreferences({ browserReminderEnabled: true });
        toast.success(
          "You’ll get a browser alert when you open the dashboard on days with shoots scheduled"
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save preference"
        );
      }
    } else {
      try {
        await updatePreferences({ browserReminderEnabled: false });
        toast.success("Browser reminders turned off");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save preference"
        );
      }
    }
  }

  return (
    <section className="border border-border bg-bg-secondary p-6 max-w-lg mt-6">
      <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
        Notifications
      </h2>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
        A banner appears on the dashboard when you have shoots scheduled for
        today. Optionally enable a browser notification each time you open the
        dashboard on a day with scheduled shoots. This preference syncs across
        your devices.
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
              {preferences.browserReminderEnabled && permission === "granted"
                ? "Browser alerts on"
                : "Banner only"}
            </span>
          </p>
          <Button
            type="button"
            variant={preferences.browserReminderEnabled ? "secondary" : "primary"}
            className="w-full sm:w-auto"
            disabled={saving}
            onClick={() => void handleToggle()}
          >
            {preferences.browserReminderEnabled
              ? "Turn off browser alerts"
              : "Enable browser alerts"}
          </Button>
        </div>
      )}
    </section>
  );
}
