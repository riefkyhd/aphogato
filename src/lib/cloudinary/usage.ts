import "server-only";

import { v2 as cloudinary } from "cloudinary";
import {
  getCloudinaryAccount,
  listCloudinaryAccounts,
  type CloudinaryAccount,
} from "@/lib/cloudinary/accounts";
import { classifyCloudinaryAccountError } from "@/lib/cloudinary/accountStatus";
import type {
  CloudinaryAccountUsagePublic,
  CloudinaryUsageLevel,
  CloudinaryUsageMetric,
} from "@/lib/cloudinary/types";

const CACHE_TTL_MS = 30 * 60 * 1000;
const WARNING_PERCENT = 75;
const CRITICAL_PERCENT = 90;
/** Cap live storage scans so refresh stays within Admin API limits. */
const LIVE_STORAGE_SCAN_MAX_ASSETS = 10_000;

type UsageBucket = {
  usage?: number;
  limit?: number;
  used_percent?: number;
};

type CloudinaryUsageApiResponse = {
  plan?: string;
  last_updated?: string;
  resources?: number;
  objects?: UsageBucket;
  storage?: UsageBucket;
  bandwidth?: UsageBucket;
  transformations?: UsageBucket;
};

const usageCache = new Map<
  string,
  { usage: CloudinaryAccountUsagePublic; fetchedAt: number }
>();

function configureCloudinaryAccount(account: CloudinaryAccount): void {
  cloudinary.config({
    cloud_name: account.cloudName,
    api_key: account.apiKey,
    api_secret: account.apiSecret,
  });
}

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

function reportedResourceCount(raw: CloudinaryUsageApiResponse): number | null {
  if (typeof raw.resources === "number" && raw.resources > 0) {
    return raw.resources;
  }
  if (typeof raw.objects?.usage === "number" && raw.objects.usage > 0) {
    return raw.objects.usage;
  }
  if (typeof raw.resources === "number") return raw.resources;
  if (typeof raw.objects?.usage === "number") return raw.objects.usage;
  return null;
}

function summarizeUsage(
  accountId: string,
  raw: CloudinaryUsageApiResponse,
  live?: { resourceCount: number; storageBytes: number }
): CloudinaryAccountUsagePublic {
  const storage = metricFromBucket(raw.storage);
  const bandwidth = metricFromBucket(raw.bandwidth);
  const transformations = metricFromBucket(raw.transformations);

  let resources = reportedResourceCount(raw);
  let storageUsage = storage.usage;

  if (live) {
    if (live.resourceCount > 0) {
      resources = live.resourceCount;
    }
    if (live.storageBytes > 0) {
      storageUsage = live.storageBytes;
    }
  }

  const effectiveStorage: CloudinaryUsageMetric = {
    ...storage,
    usage: storageUsage,
  };

  const level = worstLevel([
    levelFromPercent(effectiveStorage.usedPercent),
    levelFromPercent(bandwidth.usedPercent),
    levelFromPercent(transformations.usedPercent),
  ]);

  return {
    accountId,
    plan: raw.plan ?? null,
    lastUpdated: raw.last_updated ?? null,
    resources,
    storage: effectiveStorage,
    bandwidth,
    transformations,
    level,
    headline: buildHeadline(
      effectiveStorage,
      bandwidth,
      transformations,
      resources
    ),
    storageLabel:
      storageUsage !== null && storageUsage > 0
        ? formatBytes(storageUsage)
        : null,
  };
}

async function fetchLiveAssetCount(): Promise<number> {
  const result = await cloudinary.search
    .expression(
      "resource_type:image OR resource_type:video OR resource_type:raw"
    )
    .max_results(1)
    .execute();

  return typeof result.total_count === "number" ? result.total_count : 0;
}

async function fetchLiveStorageBytes(
  expectedCount: number
): Promise<number> {
  if (expectedCount <= 0) return 0;

  const scanCap = Math.min(expectedCount, LIVE_STORAGE_SCAN_MAX_ASSETS);
  let totalBytes = 0;
  let scanned = 0;
  let nextCursor: string | undefined;

  do {
    const page = await cloudinary.api.resources({
      type: "upload",
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });

    for (const resource of page.resources ?? []) {
      totalBytes += typeof resource.bytes === "number" ? resource.bytes : 0;
      scanned += 1;
      if (scanned >= scanCap) break;
    }

    if (scanned >= scanCap) break;
    nextCursor = page.next_cursor;
  } while (nextCursor);

  return totalBytes;
}

async function fetchLiveAssetStats(
  raw: CloudinaryUsageApiResponse
): Promise<{ resourceCount: number; storageBytes: number } | null> {
  const liveCount = await fetchLiveAssetCount();
  if (liveCount <= 0) return null;

  const reported = reportedResourceCount(raw);
  const reportedStorage = raw.storage?.usage ?? 0;
  const needsCount = liveCount > 0 && (reported === null || reported === 0);
  const needsStorage = reportedStorage === 0;

  if (!needsCount && !needsStorage) return null;

  const storageBytes = needsStorage
    ? await fetchLiveStorageBytes(liveCount)
    : 0;

  return {
    resourceCount: needsCount ? liveCount : 0,
    storageBytes,
  };
}

async function fetchAccountUsage(
  accountId: string
): Promise<CloudinaryAccountUsagePublic> {
  const account = getCloudinaryAccount(accountId);
  configureCloudinaryAccount(account);

  const raw = (await cloudinary.api.usage()) as CloudinaryUsageApiResponse;
  const live = await fetchLiveAssetStats(raw);
  return summarizeUsage(accountId, raw, live ?? undefined);
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
    const classified = classifyCloudinaryAccountError(err);
    const fallback: CloudinaryAccountUsagePublic = {
      accountId,
      plan: null,
      lastUpdated: null,
      resources: null,
      storage: { usage: null, limit: null, usedPercent: null },
      bandwidth: { usage: null, limit: null, usedPercent: null },
      transformations: { usage: null, limit: null, usedPercent: null },
      level: classified.health === "disabled" ? "disabled" : "unknown",
      headline: classified.headline,
      storageLabel: null,
      error: classified.message,
      accountHealth: classified.health,
    };
    usageCache.set(accountId, { usage: fallback, fetchedAt: Date.now() });
    return fallback;
  }
}

export async function getCloudinaryUsageForAllAccounts(options?: {
  refresh?: boolean;
}): Promise<CloudinaryAccountUsagePublic[]> {
  const accounts = listCloudinaryAccounts();
  const usage: CloudinaryAccountUsagePublic[] = [];

  // Sequential: cloudinary.config() is global; parallel calls race credentials.
  for (const account of accounts) {
    usage.push(await getCloudinaryAccountUsage(account.id, options));
  }

  return usage;
}

export function pickAccountWithMostHeadroom(
  usage: CloudinaryAccountUsagePublic[]
): string | null {
  const ranked = usage
    .filter(
      (entry) =>
        !entry.error &&
        entry.level !== "critical" &&
        entry.level !== "disabled" &&
        entry.accountHealth !== "disabled"
    )
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

  if (defaultUsage.level === "disabled" || defaultUsage.accountHealth === "disabled") {
    return {
      defaultUsage,
      suggestedAccountId:
        suggestedAccountId && suggestedAccountId !== options.defaultAccountId
          ? suggestedAccountId
          : null,
      message:
        suggestedAccountId && suggestedAccountId !== options.defaultAccountId
          ? "Default Cloudinary account is disabled or inactive. Switch to another account before creating projects, or re-enable the default in the Cloudinary console."
          : "Default Cloudinary account is disabled or inactive. Re-enable it in the Cloudinary console (billing/plan) before creating projects — photos will not load while it stays disabled.",
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
