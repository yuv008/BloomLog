import type { DailyEntry, FoodLogEntry, WellnessTimelineItem } from "@/lib/types";
import { formatEventTime } from "@/lib/calendar/format";

export function buildWellnessTimeline(
  daily: DailyEntry | null | undefined,
  foodLog: FoodLogEntry[],
  timeZone: string,
  waterGoal = 2000
): WellnessTimelineItem[] {
  const items: WellnessTimelineItem[] = [];

  for (const meal of foodLog) {
    items.push({
      id: `meal-${meal.id}`,
      title: meal.name,
      category: "nourish",
      kind: "wellness_derived",
      timeLabel: meal.logged_at
        ? formatEventTime(meal.logged_at, false, timeZone)
        : undefined,
      meta: meal.meal_slot,
    });
  }

  if (daily?.water_ml && daily.water_ml >= waterGoal) {
    items.push({
      id: "water-goal",
      title: "hydration goal met",
      category: "nourish",
      kind: "wellness_derived",
      meta: `${daily.water_ml} ml`,
    });
  }

  if (daily?.sleep_start && daily?.sleep_end) {
    items.push({
      id: "sleep-block",
      title: "rest logged",
      category: "rest",
      kind: "wellness_derived",
      timeLabel: formatEventTime(daily.sleep_start, false, timeZone),
      meta: daily.sleep_quality ?? undefined,
    });
  }

  return items;
}
