"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { HealthDashboard } from "@/components/health/health-dashboard";
import {
  useUserId,
  useProfile,
  useDaily,
  useFoodLog,
  useNutritionSummary,
  useHydrationStreak,
  useInvalidateNourish,
  usePatchDailyCache,
} from "@/hooks/use-bloom-data";
import * as api from "@/lib/data/api";
import { trackEvent } from "@/lib/analytics/posthog";
import { maybeAwardKitchenPitcher } from "@/lib/data/health-rewards";

export default function NourishPage() {
  const userId = useUserId();
  const { data: profile } = useProfile(userId);
  const { data: daily } = useDaily(userId);
  const { data: foodLog = [] } = useFoodLog(userId);
  const { data: summary } = useNutritionSummary(userId);
  const { data: streak = 0 } = useHydrationStreak(userId);
  const invalidate = useInvalidateNourish();
  const patchDaily = usePatchDailyCache();

  const onAddWater = useCallback(
    async (ml: number) => {
      if (!userId) return;
      const entry = await api.addWater(userId, ml);
      patchDaily(userId, entry);
      invalidate(userId);
      trackEvent("water_added", { ml, source: "nourish" });
    },
    [userId, patchDaily, invalidate]
  );

  useEffect(() => {
    if (userId && streak >= 7) {
      maybeAwardKitchenPitcher(userId, streak).then(() => {
        invalidate(userId);
      });
    }
  }, [userId, streak, invalidate]);

  const displaySummary = summary ?? {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    meal_count: 0,
  };

  if (!userId) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-whisper">
        warming the kitchen…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <HealthDashboard
        profile={profile ?? undefined}
        daily={daily ?? undefined}
        summary={displaySummary}
        foodLog={foodLog}
        streak={streak}
        onAddWater={onAddWater}
      />
      <Link href="/nourish/recipes" className="block text-center text-sm text-sage">
        browse cozy recipe library →
      </Link>
    </div>
  );
}
