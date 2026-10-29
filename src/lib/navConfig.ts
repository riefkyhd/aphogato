import { FEATURES } from "@/lib/features";

export type NavItemId =
  | "projects"
  | "calendar"
  | "finance"
  | "settings"
  // Legacy identifiers retained for backward compatibility
  | "home"
  | "quotes"
  | "clients"
  | "galleries";

export type NavItemConfig = {
  id: NavItemId;
  label: string;
  href: string;
  showCalendarBell?: boolean;
};

/**
 * Returns the 4 consolidated top-level workspaces:
 * 1. Projects (/dashboard)
 * 2. Schedule & Clients (/dashboard/calendar)
 * 3. Finance & Sales (/dashboard/finance)
 * 4. Settings (/dashboard/settings)
 */
export function getDashboardNavItems(): NavItemConfig[] {
  const items: (NavItemConfig & { visible: boolean })[] = [
    {
      id: "projects",
      label: "Projects",
      href: "/dashboard",
      visible: true,
    },
    {
      id: "calendar",
      label: "Schedule & Clients",
      href: "/dashboard/calendar",
      visible: FEATURES.calendar || FEATURES.clients,
      showCalendarBell: true,
    },
    {
      id: "finance",
      label: "Finance & Sales",
      href: "/dashboard/finance",
      visible:
        FEATURES.finance ||
        FEATURES.quotations ||
        FEATURES.invoices ||
        FEATURES.pricing,
    },
    {
      id: "settings",
      label: "Settings",
      href: "/dashboard/settings",
      visible: FEATURES.settings,
    },
  ];

  return items.filter((item) => item.visible);
}

export const PORTFOLIO_URL = "https://muhammad-hadid.com";
