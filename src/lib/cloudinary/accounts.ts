import "server-only";

import type { CloudinaryAccountPublic } from "@/lib/cloudinary/types";

export type { CloudinaryAccountPublic } from "@/lib/cloudinary/types";

export const DEFAULT_CLOUDINARY_ACCOUNT_ID = "default";

export type CloudinaryAccount = {
  id: string;
  label: string;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function accountLabelFromId(id: string): string {
  if (id === DEFAULT_CLOUDINARY_ACCOUNT_ID) return "Default";
  return id
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readDefaultAccountFromEnv(): CloudinaryAccount | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return null;

  return {
    id: DEFAULT_CLOUDINARY_ACCOUNT_ID,
    label: accountLabelFromId(DEFAULT_CLOUDINARY_ACCOUNT_ID),
    cloudName,
    apiKey,
    apiSecret,
  };
}

function readAdditionalAccountsFromEnv(): CloudinaryAccount[] {
  const accounts: CloudinaryAccount[] = [];
  const pattern = /^CLOUDINARY_ACCOUNT_([A-Z0-9_]+)_CLOUD_NAME$/;

  for (const [key, cloudNameRaw] of Object.entries(process.env)) {
    const match = key.match(pattern);
    if (!match) continue;

    const slug = match[1];
    const id = slug.toLowerCase();
    if (id === DEFAULT_CLOUDINARY_ACCOUNT_ID) continue;

    const cloudName = cloudNameRaw?.trim();
    const apiKey = process.env[`CLOUDINARY_ACCOUNT_${slug}_API_KEY`]?.trim();
    const apiSecret =
      process.env[`CLOUDINARY_ACCOUNT_${slug}_API_SECRET`]?.trim();
    const label =
      process.env[`CLOUDINARY_ACCOUNT_${slug}_LABEL`]?.trim() ||
      accountLabelFromId(id);

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        `Incomplete Cloudinary account "${id}". Set CLOUDINARY_ACCOUNT_${slug}_CLOUD_NAME, _API_KEY, and _API_SECRET.`
      );
    }

    accounts.push({ id, label, cloudName, apiKey, apiSecret });
  }

  return accounts.sort((a, b) => a.label.localeCompare(b.label));
}

let cachedAccounts: CloudinaryAccount[] | null = null;

export function listCloudinaryAccounts(): CloudinaryAccount[] {
  if (cachedAccounts) return cachedAccounts;

  const accounts = new Map<string, CloudinaryAccount>();
  const defaultAccount = readDefaultAccountFromEnv();
  if (defaultAccount) {
    accounts.set(defaultAccount.id, defaultAccount);
  }

  for (const account of readAdditionalAccountsFromEnv()) {
    accounts.set(account.id, account);
  }

  if (accounts.size === 0) {
    throw new Error(
      "No Cloudinary accounts configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  cachedAccounts = Array.from(accounts.values()).sort((a, b) => {
    if (a.id === DEFAULT_CLOUDINARY_ACCOUNT_ID) return -1;
    if (b.id === DEFAULT_CLOUDINARY_ACCOUNT_ID) return 1;
    return a.label.localeCompare(b.label);
  });

  return cachedAccounts;
}

export function listCloudinaryAccountsPublic(): CloudinaryAccountPublic[] {
  return listCloudinaryAccounts().map(({ id, label, cloudName }) => ({
    id,
    label,
    cloudName,
  }));
}

export function getCloudinaryAccount(accountId: string): CloudinaryAccount {
  const account = listCloudinaryAccounts().find((entry) => entry.id === accountId);
  if (!account) {
    throw new Error(`Unknown Cloudinary account "${accountId}".`);
  }
  return account;
}

export function resolveConfiguredDefaultAccountId(): string {
  const fromEnv = process.env.CLOUDINARY_DEFAULT_ACCOUNT?.trim();
  if (fromEnv) {
    getCloudinaryAccount(fromEnv);
    return fromEnv;
  }
  return DEFAULT_CLOUDINARY_ACCOUNT_ID;
}

export function getProjectCloudinaryAccountId(project: {
  cloudinary_account?: string | null;
}): string {
  const accountId = project.cloudinary_account?.trim();
  if (!accountId) return DEFAULT_CLOUDINARY_ACCOUNT_ID;
  getCloudinaryAccount(accountId);
  return accountId;
}

export function cloudNameFromDeliveryUrl(url: string): string | null {
  const match = url.match(/https:\/\/res\.cloudinary\.com\/([^/]+)\//i);
  return match?.[1] ?? null;
}

export function resolveAccountIdForUrl(url: string): string {
  const cloudName = cloudNameFromDeliveryUrl(url);
  if (!cloudName) {
    throw new Error("Could not determine Cloudinary cloud name from URL");
  }

  const account = listCloudinaryAccounts().find(
    (entry) => entry.cloudName === cloudName
  );
  if (!account) {
    throw new Error(
      `No Cloudinary account configured for cloud "${cloudName}".`
    );
  }
  return account.id;
}

export function getCloudinaryAuth(accountId: string): {
  cloud: string;
  auth: string;
  apiKey: string;
  apiSecret: string;
} {
  const account = getCloudinaryAccount(accountId);
  return {
    cloud: account.cloudName,
    auth: Buffer.from(`${account.apiKey}:${account.apiSecret}`).toString(
      "base64"
    ),
    apiKey: account.apiKey,
    apiSecret: account.apiSecret,
  };
}
