"use client";

import Link from "next/link";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { WellnessBloom } from "@/components/health/wellness-bloom";
import { CalorieGentleRing } from "@/components/health/calorie-gentle-ring";
import { MacroPetals } from "@/components/health/macro-petals";
import { WaterTracker } from "@/components/water/water-tracker";
import { NourishQuestChip } from "@/components/quests/nourish-quest-chip";
import { MealSlotTimeline } from "@/components/health/meal-slot-timeline";
import { DayContextBar } from "@/components/layout/day-context-bar";
import { hasMealPhoto } from "@/lib/media/meal-photo-url";
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
  JournalLetter,
  QuestCompletion,
  UserProfile,
} from "@/lib/types";

export function HealthDashboard({
  userId,
  date,
  quests = [],
  letters = [],
  profile,
  daily,
  summary,
  foodLog,
  streak,
  onAddWater,
}: {
  userId?: string;
  date?: string;
  quests?: QuestCompletion[];
  letters?: JournalLetter[];
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
  const sleepWhisper = pickSleepFoodWhisper(
    daily ?? null,
    foodLog,
    profile?.timezone
  );
  const hydrationWhisper = pickHydrationInsight(waterMl, waterGoal, streak);
  const whisper = moodWhisper ?? sleepWhisper ?? hydrationWhisper;

  return (
    <div className="space-y-5 w-full min-w-0">
      <div>
        <h1 className="font-display text-2xl text-ink">nourish</h1>
        <DayContextBar variant="compact" className="mt-0.5" />
        <p className="text-sm text-whisper mt-1">{pickEncouragement(seed)}</p>
      </div>

      <WellnessBloom label={label} />

      {userId && date && (
        <NourishQuestChip
          userId={userId}
          date={date}
          completions={quests}
          daily={daily}
          foodLog={foodLog}
          profile={profile}
          letters={letters}
        />
      )}

      <Card>
        <CalorieGentleRing calories={summary.calories} target={target} display={display} />
        <div className="mt-4 pt-4 border-t border-beige/40">
          <MacroPetals summary={summary} />
        </div>
      </Card>

      <WaterTracker
        variant="compact"
        waterMl={waterMl}
        goalMl={waterGoal}
        streak={streak}
        onAdd={onAddWater}
      />

      <Card>
        <p className="font-display text-lg text-ink mb-3">today&apos;s bites</p>
        <MealSlotTimeline entries={foodLog} />
        {foodLog.some(hasMealPhoto) && (
          <p className="mt-3 text-xs text-whisper">
            <Link href="/shelf" className="underline decoration-beige/80">
              meal polaroids live on your memory shelf →
            </Link>
          </p>
        )}
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
