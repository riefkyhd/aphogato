import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary";
type Size = "default" | "sm" | "icon";

const sizeClasses: Record<Size, string> = {
  default: "",
  sm: "!text-[11px] !min-h-9 !px-3 !py-2",
  icon: "!h-10 !w-10 !min-h-0 !p-0",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      type = "button",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base = variant === "primary" ? "btn-primary" : "btn-secondary";
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          base,
          "inline-flex items-center justify-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
