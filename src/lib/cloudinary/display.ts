import type {
  CloudinaryAccountUsagePublic,
  CloudinaryUsageLevel,
  CloudinaryUsageMetric,
} from "@/lib/cloudinary/types";

export function usageLevelClass(level: CloudinaryUsageLevel): string {
  switch (level) {
    case "critical":
    case "disabled":
      return "text-status-cancelled";
    case "warning":
      return "text-status-editing";
    case "ok":
      return "text-status-delivered";
    default:
      return "text-text-muted";
  }
}

export function usageLevelBorderClass(level: CloudinaryUsageLevel): string {
  switch (level) {
    case "critical":
    case "disabled":
      return "border-status-cancelled/40 bg-status-cancelled/10";
    case "warning":
      return "border-status-editing/30 bg-status-editing/10";
    case "ok":
      return "border-border bg-bg-secondary/40";
    default:
      return "border-border bg-bg-secondary/40";
  }
}

export function usageBarClass(level: CloudinaryUsageLevel): string {
  switch (level) {
    case "critical":
    case "disabled":
      return "bg-status-cancelled";
    case "warning":
      return "bg-status-editing";
    case "ok":
      return "bg-status-delivered";
    default:
      return "bg-border";
  }
}

function metricPercent(metric: CloudinaryUsageMetric): number | null {
  if (metric.usedPercent !== null) return metric.usedPercent;
  if (
    metric.usage !== null &&
    metric.limit !== null &&
    metric.limit > 0
  ) {
    return (metric.usage / metric.limit) * 100;
  }
  return null;
}

export function usagePeakPercent(
  entry: CloudinaryAccountUsagePublic
): number | null {
  const values = [
    entry.storage,
    entry.bandwidth,
    entry.transformations,
  ]
    .map(metricPercent)
    .filter((value): value is number => value !== null);

  return values.length > 0 ? Math.max(...values) : null;
}

export function usagePeakMetricShort(
  entry: CloudinaryAccountUsagePublic
): string | null {
  const candidates = [
    { label: "BW", metric: entry.bandwidth },
    { label: "Storage", metric: entry.storage },
    { label: "Transforms", metric: entry.transformations },
  ]
    .map(({ label, metric }) => {
      const percent = metricPercent(metric);
      return percent === null ? null : { label, percent };
    })
    .filter((item): item is { label: string; percent: number } => item !== null)
    .sort((a, b) => b.percent - a.percent);

  const peak = candidates[0];
  if (!peak) return null;
  return `${peak.label} ${Math.round(peak.percent)}%`;
}

export function formatMetricPercent(
  name: string,
  metric: CloudinaryUsageMetric
): string | null {
  const percent = metricPercent(metric);
  if (percent === null) return null;
  return `${name} ${Math.round(percent)}%`;
}
