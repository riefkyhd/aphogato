import "server-only";

import { v2 as cloudinary } from "cloudinary";
import {
  getCloudinaryAccount,
  listCloudinaryAccounts,
} from "@/lib/cloudinary/accounts";
import type {
  CloudinaryAccountUsagePublic,
  CloudinaryUsageLevel,
  CloudinaryUsageMetric,
} from "@/lib/cloudinary/types";

const CACHE_TTL_MS = 30 * 60 * 1000;
const WARNING_PERCENT = 75;
const CRITICAL_PERCENT = 90;

type UsageBucket = {
  usage?: number;
  limit?: number;
  used_percent?: number;
};

type CloudinaryUsageApiResponse = {
  plan?: string;
  last_updated?: string;
  resources?: number;
  storage?: UsageBucket;
  bandwidth?: UsageBucket;
  transformations?: UsageBucket;
};

const usageCache = new Map<
  string,
  { usage: CloudinaryAccountUsagePublic; fetchedAt: number }
>();

function metricFromBucket(bucket?: UsageBucket): CloudinaryUsageMetric {
  if (!bucket) {
    return { usage: null, limit: null, usedPercent: null };
  }
  return {
    usage: typeof bucket.usage === "number" ? bucket.usage : null,
    limit: typeof bucket.limit === "number" ? bucket.limit : null,
    usedPercent:
      typeof bucket.used_percent === "number" ? bucket.used_percent : null,
  };
}

function levelFromPercent(percent: number | null): CloudinaryUsageLevel {
  if (percent === null) return "unknown";
  if (percent >= CRITICAL_PERCENT) return "critical";
  if (percent >= WARNING_PERCENT) return "warning";
  return "ok";
}

function worstLevel(levels: CloudinaryUsageLevel[]): CloudinaryUsageLevel {
  if (levels.includes("critical")) return "critical";
  if (levels.includes("warning")) return "warning";
  if (levels.includes("ok")) return "ok";
  return "unknown";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatMetricLabel(
  name: string,
  metric: CloudinaryUsageMetric
): string | null {
  if (metric.usedPercent !== null) {
    return `${name} ${Math.round(metric.usedPercent)}%`;
  }
  if (metric.usage !== null && metric.limit !== null && metric.limit > 0) {
    const percent = (metric.usage / metric.limit) * 100;
    return `${name} ${Math.round(percent)}%`;
  }
  return null;
}

function buildHeadline(
  storage: CloudinaryUsageMetric,
  bandwidth: CloudinaryUsageMetric,
  transformations: CloudinaryUsageMetric,
  resources: number | null
): string {
  const parts = [
    formatMetricLabel("Storage", storage),
    formatMetricLabel("Bandwidth", bandwidth),
    formatMetricLabel("Transforms", transformations),
  ].filter((part): part is string => Boolean(part));

  if (parts.length > 0) return parts.join(" · ");

  if (resources !== null) {
    return `${resources.toLocaleString()} assets`;
  }

  return "Usage data unavailable";
}

function summarizeUsage(
  accountId: string,
  raw: CloudinaryUsageApiResponse
): CloudinaryAccountUsagePublic {
  const storage = metricFromBucket(raw.storage);
  const bandwidth = metricFromBucket(raw.bandwidth);
  const transformations = metricFromBucket(raw.transformations);
  const resources =
    typeof raw.resources === "number" ? raw.resources : null;

  const level = worstLevel([
    levelFromPercent(storage.usedPercent),
    levelFromPercent(bandwidth.usedPercent),
    levelFromPercent(transformations.usedPercent),
  ]);

  return {
    accountId,
    plan: raw.plan ?? null,
    lastUpdated: raw.last_updated ?? null,
    resources,
    storage,
    bandwidth,
    transformations,
    level,
    headline: buildHeadline(storage, bandwidth, transformations, resources),
    storageLabel:
      storage.usage !== null ? formatBytes(storage.usage) : null,
  };
}

async function fetchAccountUsage(
  accountId: string
): Promise<CloudinaryAccountUsagePublic> {
  const account = getCloudinaryAccount(accountId);
  cloudinary.config({
    cloud_name: account.cloudName,
    api_key: account.apiKey,
    api_secret: account.apiSecret,
  });

  const raw = (await cloudinary.api.usage()) as CloudinaryUsageApiResponse;
  return summarizeUsage(accountId, raw);
}

export async function getCloudinaryAccountUsage(
  accountId: string,
  options: { refresh?: boolean } = {}
): Promise<CloudinaryAccountUsagePublic> {
  const cached = usageCache.get(accountId);
  if (!options.refresh && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.usage;
  }

  try {
    const usage = await fetchAccountUsage(accountId);
    usageCache.set(accountId, { usage, fetchedAt: Date.now() });
    return usage;
  } catch (err) {
    const fallback: CloudinaryAccountUsagePublic = {
      accountId,
      plan: null,
      lastUpdated: null,
      resources: null,
      storage: { usage: null, limit: null, usedPercent: null },
      bandwidth: { usage: null, limit: null, usedPercent: null },
      transformations: { usage: null, limit: null, usedPercent: null },
      level: "unknown",
      headline: "Could not load usage",
      storageLabel: null,
      error: err instanceof Error ? err.message : "Failed to load usage",
    };
    usageCache.set(accountId, { usage: fallback, fetchedAt: Date.now() });
    return fallback;
  }
}

export async function getCloudinaryUsageForAllAccounts(options?: {
  refresh?: boolean;
}): Promise<CloudinaryAccountUsagePublic[]> {
  const accounts = listCloudinaryAccounts();
  return Promise.all(
    accounts.map((account) => getCloudinaryAccountUsage(account.id, options))
  );
}

export function pickAccountWithMostHeadroom(
  usage: CloudinaryAccountUsagePublic[]
): string | null {
  const ranked = usage
    .filter((entry) => !entry.error && entry.level !== "critical")
    .map((entry) => {
      const percents = [
        entry.storage.usedPercent,
        entry.bandwidth.usedPercent,
        entry.transformations.usedPercent,
      ].filter((value): value is number => value !== null);

      const score =
        percents.length > 0 ? Math.max(...percents) : entry.level === "ok" ? 0 : 50;

      return { accountId: entry.accountId, score };
    })
    .sort((a, b) => a.score - b.score);

  return ranked[0]?.accountId ?? null;
}

export function buildNewProjectUsageHint(options: {
  defaultAccountId: string;
  usage: CloudinaryAccountUsagePublic[];
}): {
  defaultUsage: CloudinaryAccountUsagePublic | null;
  suggestedAccountId: string | null;
  message: string | null;
} {
  const defaultUsage =
    options.usage.find((entry) => entry.accountId === options.defaultAccountId) ??
    null;

  const suggestedAccountId = pickAccountWithMostHeadroom(options.usage);

  if (!defaultUsage || defaultUsage.level === "ok" || defaultUsage.level === "unknown") {
    return {
      defaultUsage,
      suggestedAccountId: null,
      message: null,
    };
  }

  const defaultLabel = defaultUsage.headline.toLowerCase();

  if (
    suggestedAccountId &&
    suggestedAccountId !== options.defaultAccountId &&
    (defaultUsage.level === "warning" || defaultUsage.level === "critical")
  ) {
    const suggested = options.usage.find(
      (entry) => entry.accountId === suggestedAccountId
    );
    return {
      defaultUsage,
      suggestedAccountId,
      message: `Default Cloudinary account is at ${defaultLabel}. Consider switching the default to ${
        suggested?.headline ?? "another account"
      } in Settings before creating large galleries.`,
    };
  }

  if (defaultUsage.level === "critical") {
    return {
      defaultUsage,
      suggestedAccountId: null,
      message: `Default Cloudinary account is nearly full (${defaultLabel}). Upgrade the plan or switch the default account in Settings before uploading many photos.`,
    };
  }

  return {
    defaultUsage,
    suggestedAccountId: null,
    message: `Default Cloudinary account is getting full (${defaultLabel}). New projects will use this account until you change the default in Settings.`,
  };
}
