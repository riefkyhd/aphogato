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
  layoutMode = "dashboard",
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
  className?: string;
  layoutMode?: "gallery" | "dashboard";
}) {
  const columnCount = useColumnCount(layoutMode);
  const columns = useMemo(
    () => distributeRoundRobin(items, columnCount),
    [items, columnCount]
  );

  const gapClass = className ?? "gap-[2px]";

  return (
    <div className={cn("flex", gapClass)}>
      {columns.map((column, colIdx) => (
        <div
          key={colIdx}
          className={cn("flex min-w-0 flex-1 flex-col", gapClass)}
        >
          {column.map((item) => (
            <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
