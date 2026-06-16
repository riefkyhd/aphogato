"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConnectGoogleCalendarButton } from "@/components/calendar/ConnectGoogleCalendarButton";
import { consumeGoogleOAuthReturnPath } from "@/lib/calendar/openGoogleOAuthConnect";

export function GoogleCalendarSettings({
  isConnected: initialConnected,
  isOAuthConfigured,
}: {
  isConnected: boolean;
  isOAuthConfigured: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConnected = initialConnected;

  const finishOAuthFlow = useCallback(
    (message: { type: "success" } | { type: "error"; text: string }) => {
      if (message.type === "success") {
        toast.success("Google Calendar connected");
      } else {
        toast.error(message.text);
      }

      if (window.opener && !window.opener.closed) {
        if (message.type === "success") {
          window.opener.location.reload();
        } else {
          window.opener.focus();
        }
        window.close();
        return;
      }

      const returnTo = consumeGoogleOAuthReturnPath();
      if (message.type === "success" && returnTo && returnTo !== "/dashboard/settings") {
        router.replace(returnTo);
        router.refresh();
        return;
      }

      router.replace("/dashboard/settings");
      if (message.type === "success") {
        router.refresh();
      }
    },
    [router]
  );

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      finishOAuthFlow({ type: "success" });
      return;
    }

    const err = searchParams.get("error");
    if (err) {
      finishOAuthFlow({ type: "error", text: decodeURIComponent(err) });
    }
  }, [finishOAuthFlow, searchParams]);

  return (
    <section className="border border-border bg-bg-secondary p-6">
      <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
        Google Calendar
      </h2>
      {isConnected ? (
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-label text-status-delivered flex items-center gap-2">
            <span className="inline-block h-[6px] w-[6px] rounded-full bg-status-delivered" />
            Connected
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] text-text-secondary">
            Connect your Google account to sync shoot events to your primary
            calendar.
          </p>
          {!isOAuthConfigured ? (
            <p className="text-[13px] text-status-cancelled">
              Google OAuth is not configured on this deployment. Add{" "}
              <code className="text-[12px]">GOOGLE_CLIENT_ID</code> and{" "}
              <code className="text-[12px]">GOOGLE_CLIENT_SECRET</code> to your
              environment (and on Vercel for production), then restart the app.
            </p>
          ) : null}
          <ConnectGoogleCalendarButton
            isOAuthConfigured={isOAuthConfigured}
            variant="primary"
            size="default"
            fullWidth
            className="sm:w-auto"
          >
            Connect Google Calendar
          </ConnectGoogleCalendarButton>
        </div>
      )}
    </section>
  );

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
}
