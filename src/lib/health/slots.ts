import type { MealSlot } from "@/lib/types";

export const MEAL_SLOTS: {
  id: MealSlot;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { id: "breakfast", label: "breakfast", emoji: "🌅", color: "bg-amber-100/80" },
  { id: "lunch", label: "lunch", emoji: "🥗", color: "bg-sage/20" },
  { id: "dinner", label: "dinner", emoji: "🌙", color: "bg-lavender-gray/20" },
  { id: "snack", label: "snack", emoji: "🍎", color: "bg-beige/60" },
  { id: "treat", label: "treat", emoji: "🍰", color: "bg-blush/30" },
  { id: "cafe_drink", label: "cafe", emoji: "☕", color: "bg-amber-50/80" },
];

export function getMealSlot(id: MealSlot) {
  return MEAL_SLOTS.find((s) => s.id === id);
}
