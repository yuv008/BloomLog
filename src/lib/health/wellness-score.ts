import type { DailyEntry, DailyNutritionSummary, UserProfile } from "@/lib/types";

export function wellnessLabel(
  daily: DailyEntry | null,
  summary: DailyNutritionSummary,
  waterMl: number,
  waterGoal: number
): string {
  const hydrated = waterMl >= waterGoal * 0.7;
  const fed = summary.meal_count >= 2;
  const mood = daily?.mood;

  if (hydrated && fed && mood && ["sunny", "cozy", "golden_hour"].includes(mood)) {
    return "balanced";
  }
  if (hydrated && summary.meal_count >= 1) return "cozy fuel";
  if (hydrated) return "hydrated";
  if (summary.meal_count >= 1) return "gently fed";
  if (mood === "rainy" || mood === "stormy") return "soft day";
  return "resting";
}

export function caloriePercent(summary: DailyNutritionSummary, target: number | null | undefined) {
  if (!target || target <= 0) return 0;
  return Math.min(Math.round((summary.calories / target) * 100), 130);
}

export function defaultCalorieTarget(style?: UserProfile["macro_style"]): number {
  switch (style) {
    case "protein_forward":
      return 2100;
    case "gentle":
      return 1900;
    default:
      return 2000;
  }
}
