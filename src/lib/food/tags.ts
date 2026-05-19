import type { FoodTag } from "@/lib/types";

export const FOOD_TAGS: { id: FoodTag; label: string; emoji: string }[] = [
  { id: "healthy", label: "Healthy", emoji: "🥗" },
  { id: "homemade", label: "Homemade", emoji: "🏠" },
  { id: "comfort_food", label: "Comfort Food", emoji: "🫕" },
  { id: "protein_rich", label: "Protein Rich", emoji: "🥚" },
  { id: "fast_food", label: "Fast Food", emoji: "🍔" },
];
