"use client";

import { Fragment, useMemo } from "react";
import { useColumnCount } from "@/hooks/useColumnCount";
import { distributeRoundRobin } from "@/lib/masonryColumns";
import { cn } from "@/lib/utils";

export function MasonryColumnGrid<T>({
  items,
  renderItem,
  getKey,
  className,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
  className?: string;
}) {
  const columnCount = useColumnCount();
  const columns = useMemo(
    () => distributeRoundRobin(items, columnCount),
    [items, columnCount]
  );

  return (
    <div className={cn("flex gap-[2px]", className)}>
      {columns.map((column, colIdx) => (
        <div
          key={colIdx}
          className="flex min-w-0 flex-1 flex-col gap-[2px]"
        >
          {column.map((item) => (
            <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
