const SESSION_KEY = "aphogato:projects-status-dirty";

export function markProjectsStatusDirty(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable (SSR / private mode)
  }
}

export function isProjectsStatusDirty(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearProjectsStatusDirty(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
