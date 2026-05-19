import { EXPENSE_CATEGORIES } from "@/lib/finance/categories";
import type { Expense, ExpenseCategory } from "@/lib/types";

export interface CategorySpend {
  category: ExpenseCategory;
  amount: number;
  color: string;
  emoji: string;
  label: string;
}

export function aggregateExpensesByCategory(expenses: Expense[]): CategorySpend[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + Number(e.amount));
  }

  return EXPENSE_CATEGORIES.map((cat) => ({
    category: cat.id,
    amount: totals.get(cat.id) ?? 0,
    color: cat.color,
    emoji: cat.emoji,
    label: cat.label,
  })).filter((row) => row.amount > 0);
}
