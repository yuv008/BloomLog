"use client";

import Link from "next/link";
import { Card } from "@/components/primitives/card";
import type { DailyNutritionSummary } from "@/lib/types";

export function NourishStrip({
  summary,
  waterMl,
  waterGoal,
}: {
  summary: DailyNutritionSummary;
  waterMl: number;
  waterGoal: number;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg text-ink">nourish</p>
          <p className="text-xs text-whisper truncate">
            {summary.meal_count} logged · {waterMl}/{waterGoal}ml water
          </p>
        </div>
        <Link
          href="/nourish"
          className="shrink-0 rounded-full bg-sage/25 px-4 py-2 text-xs text-ink"
        >
          open
        </Link>
      </div>
    </Card>
  );
}
