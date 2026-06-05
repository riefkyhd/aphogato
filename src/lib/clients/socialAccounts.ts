import type { ClientSocialAccount, ClientSocialPlatform } from "@/lib/types";

export const CLIENT_SOCIAL_PLATFORMS: ClientSocialPlatform[] = [
  "instagram",
  "threads",
];

export const CLIENT_SOCIAL_LABELS: Record<ClientSocialPlatform, string> = {
  instagram: "Instagram",
  threads: "Threads",
};

export function normalizeSocialUsername(raw: string): string {
  let value = raw.trim();
  if (!value) return "";

  value = value.replace(/^@+/, "");

  const instagramMatch = value.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i
  );
  if (instagramMatch?.[1]) return instagramMatch[1].replace(/^@+/, "");

  const threadsMatch = value.match(
    /(?:https?:\/\/)?(?:www\.)?threads\.(?:net|com)\/@?([^/?#]+)/i
  );
  if (threadsMatch?.[1]) return threadsMatch[1].replace(/^@+/, "");

  return value;
}

export function socialProfileUrl(account: ClientSocialAccount): string {
  const handle = normalizeSocialUsername(account.username);
  if (account.platform === "instagram") {
    return `https://instagram.com/${encodeURIComponent(handle)}`;
  }
  return `https://www.threads.net/@${encodeURIComponent(handle)}`;
}

export function parseSocialAccountsInput(
  raw: unknown
): ClientSocialAccount[] | { error: string } {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    return { error: "social_accounts must be an array" };
  }

  const seen = new Set<ClientSocialPlatform>();
  const accounts: ClientSocialAccount[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return { error: "Invalid social account entry" };
    }
    const platform = (item as { platform?: string }).platform;
    const usernameRaw = (item as { username?: string }).username;

    if (platform !== "instagram" && platform !== "threads") {
      return { error: "Unsupported social platform" };
    }

    const username = normalizeSocialUsername(
      typeof usernameRaw === "string" ? usernameRaw : ""
    );
    if (!username) continue;

    if (seen.has(platform)) {
      return { error: `Only one ${CLIENT_SOCIAL_LABELS[platform]} account per client` };
    }
    seen.add(platform);
    accounts.push({ platform, username });
  }

  return accounts;
}

export function normalizeClientSocialAccounts(
  raw: unknown
): ClientSocialAccount[] {
  const parsed = parseSocialAccountsInput(raw);
  if (Array.isArray(parsed)) return parsed;
  return [];
}
