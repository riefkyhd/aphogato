import { cn } from "@/lib/utils";

export function PhotoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "columns-2 md:columns-3 lg:columns-4 [column-gap:2px]",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Masonry item wrapper — keeps each photo intact inside a column. */
export function PhotoCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("break-inside-avoid mb-[2px] w-full", className)}
    >
      {children}
    </div>
  );
}
