import {
  DEFAULT_CURRENCY,
  isExpenseCategory,
  type ExpenseCategory,
} from "@/lib/finance/constants";
import type { ExpenseEntry, IncomeEntry } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseAmount(value: unknown): { amount?: number; error?: string } {
  if (value == null || value === "") return { error: "amount is required" };
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      return { error: "amount must be a positive number" };
    }
    return { amount: value };
  }
  if (typeof value === "string") {
    const trimmed = value.trim().replace(/[^\d.]/g, "");
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0) {
      return { error: "amount must be a positive number" };
    }
    return { amount: n };
  }
  return { error: "amount is required" };
}

function parseDate(value: unknown): { date?: string; error?: string } {
  const date = typeof value === "string" ? value.trim() : "";
  if (!DATE_RE.test(date)) {
    return { error: "entry_date must be YYYY-MM-DD" };
  }
  return { date };
}

function parseOptionalUuid(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}

export function parseIncomeBody(body: Record<string, unknown>): {
  data?: Omit<IncomeEntry, "id" | "created_at">;
  error?: string;
} {
  const amountResult = parseAmount(body.amount);
  if (amountResult.error || amountResult.amount == null) {
    return { error: amountResult.error };
  }

  const dateResult = parseDate(body.entry_date);
  if (dateResult.error || !dateResult.date) {
    return { error: dateResult.error };
  }

  return {
    data: {
      event_id: parseOptionalUuid(body.event_id),
      entry_date: dateResult.date,
      amount: amountResult.amount,
      currency:
        typeof body.currency === "string" && body.currency.trim()
          ? body.currency.trim().toUpperCase()
          : DEFAULT_CURRENCY,
      client_name:
        typeof body.client_name === "string"
          ? body.client_name.trim() || null
          : null,
      description:
        typeof body.description === "string"
          ? body.description.trim() || null
          : null,
      notes:
        typeof body.notes === "string" ? body.notes.trim() || null : null,
    },
  };
}

export function parseIncomePatchBody(body: Record<string, unknown>): {
  data?: Partial<Omit<IncomeEntry, "id" | "created_at">>;
  error?: string;
} {
  const data: Partial<Omit<IncomeEntry, "id" | "created_at">> = {};

  if (body.amount !== undefined) {
    const amountResult = parseAmount(body.amount);
    if (amountResult.error || amountResult.amount == null) {
      return { error: amountResult.error };
    }
    data.amount = amountResult.amount;
  }

  if (body.entry_date !== undefined) {
    const dateResult = parseDate(body.entry_date);
    if (dateResult.error || !dateResult.date) {
      return { error: dateResult.error };
    }
    data.entry_date = dateResult.date;
  }

  if (body.event_id !== undefined) {
    data.event_id = parseOptionalUuid(body.event_id);
  }

  if (body.client_name !== undefined) {
    data.client_name =
      typeof body.client_name === "string"
        ? body.client_name.trim() || null
        : null;
  }

  if (body.description !== undefined) {
    data.description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;
  }

  if (body.notes !== undefined) {
    data.notes =
      typeof body.notes === "string" ? body.notes.trim() || null : null;
  }

  if (Object.keys(data).length === 0) {
    return { error: "No valid fields to update" };
  }

  return { data };
}

export function parseExpenseBody(body: Record<string, unknown>): {
  data?: Omit<ExpenseEntry, "id" | "created_at">;
  error?: string;
} {
  const amountResult = parseAmount(body.amount);
  if (amountResult.error || amountResult.amount == null) {
    return { error: amountResult.error };
  }

  const dateResult = parseDate(body.entry_date);
  if (dateResult.error || !dateResult.date) {
    return { error: dateResult.error };
  }

  const category =
    typeof body.category === "string" ? body.category.trim() : "other";
  if (!isExpenseCategory(category)) {
    return { error: "Invalid expense category" };
  }

  return {
    data: {
      event_id: parseOptionalUuid(body.event_id),
      entry_date: dateResult.date,
      amount: amountResult.amount,
      currency:
        typeof body.currency === "string" && body.currency.trim()
          ? body.currency.trim().toUpperCase()
          : DEFAULT_CURRENCY,
      category: category as ExpenseCategory,
      description:
        typeof body.description === "string"
          ? body.description.trim() || null
          : null,
      notes:
        typeof body.notes === "string" ? body.notes.trim() || null : null,
    },
  };
}

export function parseExpensePatchBody(body: Record<string, unknown>): {
  data?: Partial<Omit<ExpenseEntry, "id" | "created_at">>;
  error?: string;
} {
  const data: Partial<Omit<ExpenseEntry, "id" | "created_at">> = {};

  if (body.amount !== undefined) {
    const amountResult = parseAmount(body.amount);
    if (amountResult.error || amountResult.amount == null) {
      return { error: amountResult.error };
    }
    data.amount = amountResult.amount;
  }

  if (body.entry_date !== undefined) {
    const dateResult = parseDate(body.entry_date);
    if (dateResult.error || !dateResult.date) {
      return { error: dateResult.error };
    }
    data.entry_date = dateResult.date;
  }

  if (body.category !== undefined) {
    if (
      typeof body.category !== "string" ||
      !isExpenseCategory(body.category)
    ) {
      return { error: "Invalid expense category" };
    }
    data.category = body.category;
  }

  if (body.event_id !== undefined) {
    data.event_id = parseOptionalUuid(body.event_id);
  }

  if (body.description !== undefined) {
    data.description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;
  }

  if (body.notes !== undefined) {
    data.notes =
      typeof body.notes === "string" ? body.notes.trim() || null : null;
  }

  if (Object.keys(data).length === 0) {
    return { error: "No valid fields to update" };
  }

  return { data };
}
