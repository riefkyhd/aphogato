import { FEATURES } from "@/lib/features";

export type NavItemId =
  | "home"
  | "calendar"
  | "finance"
  | "quotes"
  | "clients"
  | "galleries"
  | "settings";

export type NavItemConfig = {
  id: NavItemId;
  label: string;
  href: string;
  showCalendarBell?: boolean;
};

export function getDashboardNavItems(): NavItemConfig[] {
  const items: (NavItemConfig & { visible: boolean })[] = [
    { id: "home", label: "Home", href: "/dashboard", visible: true },
    {
      id: "calendar",
      label: "Calendar",
      href: "/dashboard/calendar",
      visible: FEATURES.calendar,
      showCalendarBell: true,
    },
    {
      id: "finance",
      label: "Finance",
      href: "/dashboard/finance",
      visible: FEATURES.finance,
    },
    {
      id: "quotes",
      label: "Quotes",
      href: "/dashboard/quotations",
      visible:
        FEATURES.quotations || FEATURES.invoices || FEATURES.pricing,
    },
    {
      id: "clients",
      label: "Clients",
      href: "/dashboard/clients",
      visible: FEATURES.clients,
    },
    {
      id: "galleries",
      label: "Galleries",
      href: "/dashboard/galleries",
      visible: FEATURES.projectsGrid,
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
