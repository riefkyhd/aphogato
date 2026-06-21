export const DEFAULT_CURRENCY = "IDR";

export const EXPENSE_CATEGORIES = [
  "camera_rent",
  "fuel",
  "toll",
  "parking",
  "transportation",
  "equipment",
  "assistant",
  "food",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  camera_rent: "Camera rent",
  fuel: "Fuel",
  toll: "Toll",
  parking: "Parking",
  transportation: "Transportation",
  equipment: "Equipment",
  assistant: "Assistant",
  food: "Food & meals",
  other: "Other",
};

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}
