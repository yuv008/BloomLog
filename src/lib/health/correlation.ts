import { hourInTimeZone } from "@/lib/dates";
import type { DailyEntry, FoodLogEntry, Mood } from "@/lib/types";

export function pickMoodFoodWhisper(
  mood: Mood | null | undefined,
  entries: FoodLogEntry[]
): string | null {
  if (!mood || entries.length === 0) return null;

  const comfortCount = entries.filter((e) =>
    e.emotional_tags.includes("comfort_food")
  ).length;

  if (mood === "rainy" && comfortCount > 0) {
    return "comfort bites pair softly with rainy moods — totally human";
  }
  if (mood === "cozy" && entries.some((e) => e.source === "polaroid" || e.emotional_tags.includes("homemade"))) {
    return "homemade moments match your cozy mood today";
  }
  if (mood === "sunny" && entries.length >= 2) {
    return "you fed yourself well on a sunny day — lovely rhythm";
  }
  return null;
}

export function pickSleepFoodWhisper(
  daily: DailyEntry | null,
  entries: FoodLogEntry[],
  timeZone?: string
): string | null {
  if (!daily?.sleep_quality || entries.length === 0) return null;

  const lateDinner = entries.some((e) => {
    if (e.meal_slot !== "dinner") return false;
    const hour = hourInTimeZone(new Date(e.logged_at), timeZone);
    return hour >= 21;
  });

  if (lateDinner && (daily.sleep_quality === "restless" || daily.sleep_quality === "stormy")) {
    return "later dinners sometimes dance with lighter sleep — no judgment, just noticing";
  }
  if (daily.sleep_quality === "deep" && entries.some((e) => e.emotional_tags.includes("homemade"))) {
    return "homemade fuel and deep rest — a gentle pairing";
  }
  return null;
}

export function pickHydrationInsight(waterMl: number, goal: number, streak: number): string | null {
  if (streak >= 3) return `you've sipped kindly ${streak} days in a row`;
  if (waterMl >= goal) return "your bottle is happy today";
  if (waterMl >= goal * 0.5) return "halfway to a hydrated, cozy you";
  return null;
}
