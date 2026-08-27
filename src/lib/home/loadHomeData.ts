import "server-only";

import { loadTodayEvents } from "@/lib/calendar/loadTodayEvents";
import { getTodayDateString } from "@/lib/calendar/todayEvents";
import { normalizeQuotation, type SavedQuotation } from "@/lib/quotations/db";
import { createServerSupabase } from "@/lib/supabase/server";
import { unwrapQuery } from "@/lib/api/supabaseQuery";
import type { CalendarEvent, Project, ProjectStatus } from "@/lib/types";

export type HomeAttentionProject = Pick<
  Project,
  "id" | "name" | "client_name" | "status"
>;

export type HomeRecentProject = HomeAttentionProject & {
  updated_at?: string | null;
};

export type HomeRecentClient = {
  id: string;
  name: string;
  phone?: string | null;
  created_at?: string | null;
};

export type HomeData = {
  today: string;
  todayEvents: CalendarEvent[];
  monthIncome: number;
  monthExpenses: number;
  monthNet: number;
  recentQuotations: SavedQuotation[];
  attentionProjects: HomeAttentionProject[];
  recentProjects: HomeRecentProject[];
  recentClients: HomeRecentClient[];
  totalCounts: {
    clients: number;
    projects: number;
    quotations: number;
    events: number;
  };
};

const ATTENTION_STATUSES: ProjectStatus[] = ["selected", "editing"];

function monthBounds(date = new Date()): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function sumAmounts(rows: { amount: string | number }[]): number {
  return rows.reduce((total, row) => {
    const value =
      typeof row.amount === "number" ? row.amount : Number(row.amount);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

export async function loadHomeData(): Promise<HomeData> {
  const supabase = createServerSupabase();
  const { start, end } = monthBounds();
  const today = getTodayDateString();

  const [
    todayEvents,
    incomeRes,
    expenseRes,
    quotationsRes,
    attentionRes,
    recentProjectsRes,
    recentClientsRes,
    clientCountRes,
    projectCountRes,
    quotationCountRes,
    eventCountRes,
  ] = await Promise.all([
    loadTodayEvents(supabase),
    supabase
      .from("income_entries")
      .select("amount")
      .gte("entry_date", start)
      .lte("entry_date", end),
    supabase
      .from("expense_entries")
      .select("amount")
      .gte("entry_date", start)
      .lte("entry_date", end),
    supabase
      .from("quotations")
      .select("*")
      .order("quote_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("projects")
      .select("id, name, client_name, status")
      .in("status", ATTENTION_STATUSES)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("projects")
      .select("id, name, client_name, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("clients")
      .select("id, name, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("quotations").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
  ]);

  const incomeRows = unwrapQuery<{ amount: string | number }[]>(
    "home.income",
    incomeRes
  );
  const expenseRows = unwrapQuery<{ amount: string | number }[]>(
    "home.expenses",
    expenseRes
  );
  const quotationRows = unwrapQuery<Array<Record<string, unknown>>>(
    "home.quotations",
    quotationsRes
  );
  const attentionRows = unwrapQuery<HomeAttentionProject[]>(
    "home.attention",
    attentionRes
  );
  const recentProjectRows = unwrapQuery<HomeRecentProject[]>(
    "home.recentProjects",
    recentProjectsRes
  );
  const recentClientRows = unwrapQuery<HomeRecentClient[]>(
    "home.recentClients",
    recentClientsRes
  );

  const monthIncome = sumAmounts(incomeRows);
  const monthExpenses = sumAmounts(expenseRows);

  return {
    today,
    todayEvents,
    monthIncome,
    monthExpenses,
    monthNet: monthIncome - monthExpenses,
    recentQuotations: quotationRows.map((row) => normalizeQuotation(row)),
    attentionProjects: attentionRows,
    recentProjects: recentProjectRows,
    recentClients: recentClientRows,
    totalCounts: {
      clients: clientCountRes.count ?? 0,
      projects: projectCountRes.count ?? 0,
      quotations: quotationCountRes.count ?? 0,
      events: eventCountRes.count ?? 0,
    },
  };
}
