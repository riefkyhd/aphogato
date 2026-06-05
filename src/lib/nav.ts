const DASHBOARD_SECTION_PREFIXES = [
  "/dashboard/calendar",
  "/dashboard/finance",
  "/dashboard/clients",
  "/dashboard/pricing",
  "/dashboard/settings",
  "/dashboard/new",
];

export function financeIsActive(pathname: string): boolean {
  return (
    pathname === "/dashboard/finance" ||
    pathname.startsWith("/dashboard/finance/")
  );
}

export function navIsActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/finance") {
    return financeIsActive(pathname);
  }

  if (href === "/dashboard") {
    if (pathname === "/dashboard" || pathname === "/dashboard/board") {
      return true;
    }
    if (!pathname.startsWith("/dashboard/")) return false;
    return !DASHBOARD_SECTION_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
