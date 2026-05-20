"use client";

import Link from "next/link";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { WellnessBloom } from "@/components/health/wellness-bloom";
import { CalorieGentleRing } from "@/components/health/calorie-gentle-ring";
import { MacroPetals } from "@/components/health/macro-petals";
import { HydrationVignette } from "@/components/health/hydration-vignette";
import { MealSlotTimeline } from "@/components/health/meal-slot-timeline";
import { MoodFoodWhisper } from "@/components/health/mood-food-whisper";
import { pickEncouragement, HEALTH_DISCLAIMER } from "@/lib/health/copy";
import {
  wellnessLabel,
  defaultCalorieTarget,
} from "@/lib/health/wellness-score";
import {
  pickMoodFoodWhisper,
  pickSleepFoodWhisper,
  pickHydrationInsight,
} from "@/lib/health/correlation";
import type {
  DailyEntry,
  DailyNutritionSummary,
  FoodLogEntry,
  UserProfile,
} from "@/lib/types";

export function HealthDashboard({
  profile,
  daily,
  summary,
  foodLog,
  streak,
  onAddWater,
}: {
  profile: UserProfile | null | undefined;
  daily: DailyEntry | null | undefined;
  summary: DailyNutritionSummary;
  foodLog: FoodLogEntry[];
  streak: number;
  onAddWater: (ml: number) => Promise<void>;
}) {
  const waterGoal = profile?.water_goal_ml ?? 2000;
  const waterMl = daily?.water_ml ?? 0;
  const display = profile?.calorie_display ?? "soft";
  const target =
    profile?.soft_calorie_target ??
    (display === "hidden" ? null : defaultCalorieTarget(profile?.macro_style));
  const label = wellnessLabel(daily ?? null, summary, waterMl, waterGoal);
  const seed = profile?.id ?? "guest";
  const moodWhisper = pickMoodFoodWhisper(daily?.mood, foodLog);
  const sleepWhisper = pickSleepFoodWhisper(daily ?? null, foodLog);
  const hydrationWhisper = pickHydrationInsight(waterMl, waterGoal, streak);
  const whisper = moodWhisper ?? sleepWhisper ?? hydrationWhisper;

  return (
    <div className="space-y-5 w-full min-w-0">
      <div>
        <h1 className="font-display text-2xl text-ink">nourish</h1>
        <p className="text-sm text-whisper mt-1">{pickEncouragement(seed)}</p>
      </div>

      <WellnessBloom label={label} />

      <Card>
        <CalorieGentleRing calories={summary.calories} target={target} display={display} />
        <div className="mt-4 pt-4 border-t border-beige/40">
          <MacroPetals summary={summary} />
        </div>
      </Card>

      <HydrationVignette
        waterMl={waterMl}
        goalMl={waterGoal}
        streak={streak}
        onAdd={onAddWater}
      />

      <Card>
        <p className="font-display text-lg text-ink mb-3">today&apos;s bites</p>
        <MealSlotTimeline entries={foodLog} />
      </Card>

      {whisper && <MoodFoodWhisper text={whisper} />}

      <div className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href="/nourish/log">log something</Link>
        </Button>
        <Button asChild variant="ghost" className="flex-1">
          <Link href="/nourish/recipes/generate">what can I cook?</Link>
        </Button>
      </div>

      <p className="text-[10px] text-whisper text-center px-4">{HEALTH_DISCLAIMER}</p>
    </div>
  );
}
