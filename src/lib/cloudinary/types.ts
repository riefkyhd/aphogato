export const DEFAULT_CLOUDINARY_ACCOUNT_ID = "default";

export type CloudinaryAccountPublic = {
  id: string;
  label: string;
  cloudName: string;
};

export type CloudinaryUsageLevel = "ok" | "warning" | "critical" | "unknown";

export type CloudinaryUsageMetric = {
  usage: number | null;
  limit: number | null;
  usedPercent: number | null;
};

export type CloudinaryAccountUsagePublic = {
  accountId: string;
  plan: string | null;
  lastUpdated: string | null;
  resources: number | null;
  storage: CloudinaryUsageMetric;
  bandwidth: CloudinaryUsageMetric;
  transformations: CloudinaryUsageMetric;
  level: CloudinaryUsageLevel;
  headline: string;
  storageLabel: string | null;
  error?: string;
};
