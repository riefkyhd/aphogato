import "server-only";

import { getImageKitUrlEndpoint } from "@/lib/imagekit/publicConfig";

function trimEnvValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export { getImageKitUrlEndpoint };

export function getImageKitPublicKey(): string {
  return trimEnvValue(process.env.IMAGEKIT_PUBLIC_KEY);
}

export function getImageKitPrivateKey(): string {
  return trimEnvValue(process.env.IMAGEKIT_PRIVATE_KEY);
}

export function isImageKitConfigured(): boolean {
  return Boolean(
    getImageKitUrlEndpoint() &&
      getImageKitPublicKey() &&
      getImageKitPrivateKey()
  );
}

export function assertImageKitConfigured(): void {
  if (!isImageKitConfigured()) {
    throw new Error(
      "ImageKit is not configured. Set NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT, IMAGEKIT_PUBLIC_KEY, and IMAGEKIT_PRIVATE_KEY."
    );
  }
}
