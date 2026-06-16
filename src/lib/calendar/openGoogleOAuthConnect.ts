"use client";

export const GOOGLE_OAUTH_PATH = "/api/auth/google";
export const GOOGLE_OAUTH_RETURN_KEY = "aphogato-google-oauth-return";

/** Mobile browsers block or mishandle popups; full-page OAuth is more reliable. */
export function prefersSameTabGoogleOAuth(): boolean {
  if (typeof window === "undefined") return false;

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const mobileUa = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return coarse || narrow || mobileUa;
}

export function rememberGoogleOAuthReturnPath(): void {
  sessionStorage.setItem(
    GOOGLE_OAUTH_RETURN_KEY,
    `${window.location.pathname}${window.location.search}`
  );
}

export function consumeGoogleOAuthReturnPath(): string | null {
  const returnTo = sessionStorage.getItem(GOOGLE_OAUTH_RETURN_KEY);
  sessionStorage.removeItem(GOOGLE_OAUTH_RETURN_KEY);
  return returnTo;
}

export type GoogleOAuthConnectMode = "same-tab" | "popup";

export function openGoogleOAuthConnect(): GoogleOAuthConnectMode {
  rememberGoogleOAuthReturnPath();

  if (prefersSameTabGoogleOAuth()) {
    window.location.assign(GOOGLE_OAUTH_PATH);
    return "same-tab";
  }

  const popup = window.open(
    GOOGLE_OAUTH_PATH,
    "aphogato-google-oauth",
    "width=520,height=720"
  );

  if (!popup) {
    window.location.assign(GOOGLE_OAUTH_PATH);
    return "same-tab";
  }

  return "popup";
}
