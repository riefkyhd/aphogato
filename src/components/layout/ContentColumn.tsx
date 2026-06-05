import { cn } from "@/lib/utils";

/** Centered narrow column for settings and similar single-column pages. */
export function ContentColumn({
  children,
  className,
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        size === "lg" ? "max-w-2xl" : "max-w-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
