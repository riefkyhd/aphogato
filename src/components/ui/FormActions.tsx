import { cn } from "@/lib/utils";

/** Form footer: primary action last on mobile (bottom), right-aligned on desktop. */
export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2",
        "[&_button]:w-full [&_button]:sm:w-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
