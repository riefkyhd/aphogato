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

export function getImageKitUrlEndpoint(): string {
  return trimEnvValue(process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT).replace(
    /\/$/,
    ""
  );
}

export function isImageKitConfiguredPublic(): boolean {
  return Boolean(getImageKitUrlEndpoint());
}
