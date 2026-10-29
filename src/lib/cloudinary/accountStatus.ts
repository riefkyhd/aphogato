/**
 * Classify Cloudinary Admin API / delivery failures when an account is
 * disabled, inactivated, or otherwise unreachable.
 */

import type { CloudinaryAccountHealth } from "@/lib/cloudinary/types";

export type { CloudinaryAccountHealth };

export const CLOUDINARY_DISABLED_HEADLINE = "Account disabled";

export const CLOUDINARY_DISABLED_MESSAGE =
  "This Cloudinary account is disabled or inactive. Photos cannot load until it is re-enabled in the Cloudinary console (usually by fixing billing or upgrading the plan).";

/** Shown on project covers / thumbs when delivery fails. */
export const MEDIA_UNAVAILABLE_CELL_LABEL = "Unavailable";

/** Shorter cover copy for project cards (under gradient). */
export const MEDIA_UNAVAILABLE_COVER_LABEL = "Cover unavailable";

/** Dashboard / admin gallery banner when many images fail to load. */
export const MEDIA_UNAVAILABLE_BANNER_ADMIN =
  "Photos can’t load — the Cloudinary account for this project appears to be disabled or inactive. Re-enable it in the Cloudinary console to restore delivery.";

/** Client-facing gallery banner (less internal jargon). */
export const MEDIA_UNAVAILABLE_BANNER_GALLERY =
  "Photos aren’t available right now — the storage account for this gallery is disabled or inactive. Please check back later, or contact the photographer.";

export function extractErrorMessage(err: unknown): string {
  if (!err) return "";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (
      typeof obj.error === "object" &&
      obj.error !== null &&
      typeof (obj.error as Record<string, unknown>).message === "string"
    ) {
      return (obj.error as Record<string, unknown>).message as string;
    }
    try {
      const serialized = JSON.stringify(err);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // ignore serialization error
    }
  }
  const str = String(err);
  return str === "[object Object]" ? "" : str;
}

export function classifyCloudinaryAccountError(err: unknown): {
  health: Exclude<CloudinaryAccountHealth, "active">;
  headline: string;
  message: string;
} {
  const raw = extractErrorMessage(err);
  const lower = raw.toLowerCase();

  const disabled =
    lower.includes("disabled") ||
    lower.includes("inactive") ||
    lower.includes("inactivated") ||
    lower.includes("not enabled") ||
    lower.includes("suspended") ||
    lower.includes("cloud_name is disabled") ||
    lower.includes("account is locked");

  if (disabled) {
    return {
      health: "disabled",
      headline: CLOUDINARY_DISABLED_HEADLINE,
      message: CLOUDINARY_DISABLED_MESSAGE,
    };
  }

  return {
    health: "unreachable",
    headline: "Could not load usage",
    message: raw.trim() || "Failed to reach Cloudinary",
  };
}

export function isCloudinaryAccountDisabled(usage: {
  level?: string;
  accountHealth?: CloudinaryAccountHealth;
  error?: string;
} | null | undefined): boolean {
  if (!usage) return false;
  if (usage.accountHealth === "disabled" || usage.level === "disabled") {
    return true;
  }
  if (!usage.error) return false;
  return classifyCloudinaryAccountError(usage.error).health === "disabled";
}
