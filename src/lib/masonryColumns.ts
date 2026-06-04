/** Distribute items left-to-right across columns (row-major visual order). */
export function distributeRoundRobin<T>(items: T[], columnCount: number): T[][] {
  const count = Math.max(1, columnCount);
  const columns: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, index) => {
    columns[index % count].push(item);
  });
  return columns;
}
