import * as React from "react";
import { cn } from "@/lib/utils";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

/** 40×40 touch target for inline list / row actions. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, children, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center",
          "text-text-muted hover:text-text-primary transition-colors",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-text-muted",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
