"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { openGoogleOAuthConnect } from "@/lib/calendar/openGoogleOAuthConnect";
import { cn } from "@/lib/utils";

export function ConnectGoogleCalendarButton({
  isOAuthConfigured,
  className,
  size = "sm",
  variant = "secondary",
  children = "Connect Google",
  fullWidth = false,
}: {
  isOAuthConfigured: boolean;
  className?: string;
  size?: "default" | "sm";
  variant?: "primary" | "secondary";
  children?: React.ReactNode;
  fullWidth?: boolean;
}) {
  const handleConnect = useCallback(() => {
    if (!isOAuthConfigured) {
      toast.error(
        "Google OAuth is not configured on the server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment."
      );
      return;
    }

    openGoogleOAuthConnect();
  }, [isOAuthConfigured]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(fullWidth && "w-full", className)}
      disabled={!isOAuthConfigured}
      onClick={handleConnect}
    >
      {children}
    </Button>
  );
}
