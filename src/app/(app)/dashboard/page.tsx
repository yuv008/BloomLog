"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoodSkyBackground, MoodCarousel } from "@/components/mood/mood-sky";
import { GreetingHeader } from "@/components/layout/greeting-header";
import { WaterTracker } from "@/components/water/water-tracker";
import { SpendBubblesCard } from "@/components/finance/spend-bubbles";
import { NourishStrip } from "@/components/food/nourish-strip";
import { TinyQuestsCard } from "@/components/quests/tiny-quests";
import { SleepTrackerCard } from "@/components/sleep/sleep-tracker";
import { WhisperCard } from "@/components/whispers/whisper-card";
import { CharacterQuoteCard } from "@/components/dashboard/character-quote-card";
import { PetalBurst } from "@/components/motion/petal-burst";
import {
  useUserId,
  useProfile,
  useDaily,
  useExpenses,
  useMonthlyExpenses,
  useNutritionSummary,
  useQuests,
  useFoodLog,
  useJournalLetters,
  useSyncQuestsOnDaily,
  useAddWater,
  useInvalidateDaily,
  usePatchDailyCache,
  useTodayKey,
} from "@/hooks/use-bloom-data";
import { useWhisper } from "@/hooks/use-whisper";
import { useUiStore } from "@/stores/use-ui-store";
import * as api from "@/lib/data/api";
import { trackEvent } from "@/lib/analytics/posthog";
import type { Mood, ExpenseCategory, SleepQuality } from "@/lib/types";

export default function DashboardPage() {
  const userId = useUserId();
  const qc = useQueryClient();
  const { data: profile } = useProfile(userId);
  const { data: daily } = useDaily(userId);
  const { data: expenses = [] } = useExpenses(userId);
  const { data: monthlyExpenses = [] } = useMonthlyExpenses(userId);
  const { data: nutrition } = useNutritionSummary(userId);
  const { data: quests = [] } = useQuests(userId);
  const { data: foodLog = [] } = useFoodLog(userId);
  const { data: letters = [] } = useJournalLetters(userId);
  useSyncQuestsOnDaily(userId);
  const addWater = useAddWater(userId);
  const invalidate = useInvalidateDaily();
  const patchDaily = usePatchDailyCache();
  const { date, month } = useTodayKey();
  const showPetals = useUiStore((s) => s.showPetalBurst);
  const clearPetals = useUiStore((s) => s.clearPetalBurst);

  const mood = daily?.mood ?? null;
  const { text: whisperText, show: showWhisper, dismiss } = useWhisper(
    userId,
    mood,
    daily?.water_ml ?? 0,
    quests.length
  );

  const refresh = useCallback(() => {
    if (userId) {
      qc.invalidateQueries({ queryKey: ["daily", userId, date] });
      qc.invalidateQueries({ queryKey: ["expenses", userId, date] });
      qc.invalidateQueries({ queryKey: ["expenses-month", userId, month] });
      qc.invalidateQueries({ queryKey: ["foodLog", userId, date] });
      qc.invalidateQueries({ queryKey: ["nourish", "summary", userId, date] });
      qc.invalidateQueries({ queryKey: ["quests", userId, date] });
    }
  }, [userId, qc, date, month]);

  if (!userId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-whisper">
        waking up your garden…
      </div>
    );
  }

  return (
    <>
      <MoodSkyBackground mood={mood} />
      <PetalBurst show={showPetals} onDone={clearPetals} />

      <div className="space-y-5 relative z-10 w-full min-w-0 max-w-full overflow-x-hidden">
        <WhisperCard text={whisperText ?? ""} show={showWhisper} onDismiss={dismiss} />
        <GreetingHeader name={profile?.display_name} />

        <MoodCarousel
          value={mood}
          onChange={async (m: Mood) => {
            const entry = await api.setMood(userId, m, date);
            patchDaily(userId, entry);
            trackEvent("mood_set", { mood: m });
            refresh();
          }}
        />

        <WaterTracker
          variant="hero"
          waterMl={daily?.water_ml ?? 0}
          goalMl={profile?.water_goal_ml ?? 2000}
          onAdd={async (ml) => {
            await addWater(ml, "today");
          }}
        />

        {profile?.finance_enabled !== false && (
          <SpendBubblesCard
            expenses={expenses}
            monthlyExpenses={monthlyExpenses}
            onAdd={async (category: ExpenseCategory, amount: number) => {
              await api.addExpense(userId, category, amount, undefined, date);
              trackEvent("expense_logged", { category, amount });
              refresh();
            }}
          />
        )}

        <NourishStrip
          summary={
            nutrition ?? {
              calories: 0,
              protein_g: 0,
              carbs_g: 0,
              fat_g: 0,
              meal_count: 0,
            }
          }
          waterMl={daily?.water_ml ?? 0}
          waterGoal={profile?.water_goal_ml ?? 2000}
        />

        <SleepTrackerCard
          sleepStart={daily?.sleep_start ?? null}
          sleepEnd={daily?.sleep_end ?? null}
          sleepQuality={daily?.sleep_quality ?? null}
          onSave={async (start, end, quality: SleepQuality | null) => {
            await api.setSleep(userId, start, end, quality, date);
            invalidate(userId);
          }}
        />

        <TinyQuestsCard
          userId={userId}
          date={date}
          completions={quests}
          daily={daily}
          foodLog={foodLog}
          profile={profile}
          letters={letters}
          onComplete={async (key, via) => {
            const result = await api.completeQuest(userId, key, { date, via });
            if (via === "auto") {
              trackEvent("quest_claimed", { quest_key: key });
            } else {
              trackEvent("quest_completed", { quest_key: key });
            }
            if (result.gardenGranted) {
              trackEvent("quest_auto_completed", {
                quest_key: key,
                garden: true,
              });
            }
            refresh();
            qc.invalidateQueries({ queryKey: ["garden", userId] });
            return result;
          }}
        />

        <CharacterQuoteCard dateKey={date} userId={userId} />
      </div>
    </>
  );
}
