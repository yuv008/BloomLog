import type { ExpenseCategory } from "@/lib/types";

export const EXPENSE_CATEGORIES: {
  id: ExpenseCategory;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { id: "food", label: "Food", emoji: "🍽️", color: "#A8B89A" },
  { id: "cafe", label: "Cafe", emoji: "☕", color: "#C4A484" },
  { id: "treats", label: "Treats", emoji: "🍰", color: "#E8C5C0" },
  { id: "travel", label: "Travel", emoji: "✈️", color: "#B8B2C0" },
  { id: "gifts", label: "Gifts", emoji: "🎁", color: "#D4A5A5" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", color: "#C9B8A8" },
];
