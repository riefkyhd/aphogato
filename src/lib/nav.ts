const PROJECT_DETAIL_PATTERN = /^\/dashboard\/[0-9a-f-]{36}$/i;

export function financeIsActive(pathname: string): boolean {
  return (
    pathname === "/dashboard/finance" ||
    pathname.startsWith("/dashboard/finance/") ||
    quotesIsActive(pathname)
  );
}

export function quotesIsActive(pathname: string): boolean {
  return (
    pathname === "/dashboard/quotations" ||
    pathname.startsWith("/dashboard/quotations/") ||
    pathname === "/dashboard/invoices" ||
    pathname.startsWith("/dashboard/invoices/") ||
    pathname === "/dashboard/pricing" ||
    pathname.startsWith("/dashboard/pricing/")
  );
}

export function calendarIsActive(pathname: string): boolean {
  return (
    pathname === "/dashboard/calendar" ||
    pathname.startsWith("/dashboard/calendar/") ||
    pathname === "/dashboard/clients" ||
    pathname.startsWith("/dashboard/clients/")
  );
}

export function settingsIsActive(pathname: string): boolean {
  return (
    pathname === "/dashboard/settings" ||
    pathname.startsWith("/dashboard/settings/")
  );
}

export function galleriesIsActive(pathname: string): boolean {
  if (pathname === "/dashboard/galleries" || pathname.startsWith("/dashboard/galleries/")) {
    return true;
  }
  if (pathname === "/dashboard/board" || pathname.startsWith("/dashboard/board/")) {
    return true;
  }
  if (pathname === "/dashboard/new" || pathname.startsWith("/dashboard/new/")) {
    return true;
  }
  return PROJECT_DETAIL_PATTERN.test(pathname);
}

export function homeIsActive(pathname: string): boolean {
  return pathname === "/dashboard";
}

export function projectsIsActive(pathname: string): boolean {
  return homeIsActive(pathname) || galleriesIsActive(pathname);
}

export function navIsActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return projectsIsActive(pathname);
  }

  if (href === "/dashboard/calendar") {
    return calendarIsActive(pathname);
  }

  if (href === "/dashboard/finance") {
    return financeIsActive(pathname);
  }

  if (href === "/dashboard/settings") {
    return settingsIsActive(pathname);
  }

  if (href === "/dashboard/quotations") {
    return quotesIsActive(pathname);
  }

  if (href === "/dashboard/galleries") {
    return galleriesIsActive(pathname);
  }

  if (href === "/dashboard/clients") {
    return calendarIsActive(pathname);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
