import { cn } from "@/lib/utils";

/** Page header action row — equal-width on mobile, natural width on desktop. */
export function PageToolbarActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export const toolbarButtonClass = "flex-1 sm:flex-none min-w-0";
