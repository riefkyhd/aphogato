import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    const base =
      variant === "primary" ? "btn-primary" : "btn-secondary";
    return (
      <button
        ref={ref}
        type={type}
        className={cn(base, "disabled:opacity-50 disabled:cursor-not-allowed", className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
