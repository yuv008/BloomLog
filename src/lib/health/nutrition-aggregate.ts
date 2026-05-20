import type { DailyNutritionSummary, FoodLogEntry } from "@/lib/types";

export function aggregateNutrition(entries: FoodLogEntry[]): DailyNutritionSummary {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories ?? 0),
      protein_g: acc.protein_g + (e.protein_g ?? 0),
      carbs_g: acc.carbs_g + (e.carbs_g ?? 0),
      fat_g: acc.fat_g + (e.fat_g ?? 0),
      meal_count: acc.meal_count + 1,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, meal_count: 0 }
  );
}

export function macroPercents(summary: DailyNutritionSummary) {
  const total = summary.protein_g + summary.carbs_g + summary.fat_g;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((summary.protein_g / total) * 100),
    carbs: Math.round((summary.carbs_g / total) * 100),
    fat: Math.round((summary.fat_g / total) * 100),
  };
}
