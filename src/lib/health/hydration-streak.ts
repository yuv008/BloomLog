import { addDays, format, parseISO } from "date-fns";
import type { DailyEntry } from "@/lib/types";

export function computeHydrationStreak(
  entries: Pick<DailyEntry, "date" | "water_ml">[],
  goalMl: number,
  today: string
): number {
  const byDate = new Map(entries.map((e) => [e.date, e.water_ml]));
  let streak = 0;
  let d = today;
  let restUsed = false;

  for (let i = 0; i < 14; i++) {
    const ml = byDate.get(d);
    if (ml !== undefined && ml >= goalMl) {
      streak++;
    } else if (!restUsed && i > 0) {
      restUsed = true;
    } else {
      break;
    }
    d = format(addDays(parseISO(d), -1), "yyyy-MM-dd");
  }
  return streak;
}
