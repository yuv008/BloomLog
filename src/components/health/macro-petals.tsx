"use client";

import { m } from "framer-motion";
import { macroPercents } from "@/lib/health/nutrition-aggregate";
import type { DailyNutritionSummary } from "@/lib/types";

const MACROS = [
  { key: "protein" as const, label: "protein", emoji: "🥚", color: "bg-sage/50" },
  { key: "carbs" as const, label: "carbs", emoji: "🌾", color: "bg-beige/80" },
  { key: "fat" as const, label: "fats", emoji: "🥑", color: "bg-blush/40" },
];

export function MacroPetals({ summary }: { summary: DailyNutritionSummary }) {
  const pct = macroPercents(summary);
  const hasData = summary.meal_count > 0;

  return (
    <div className="space-y-2">
      <p className="text-xs text-whisper">today&apos;s balance</p>
      {MACROS.map(({ key, label, emoji, color }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-lg w-6">{emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs text-whisper mb-1">
              <span>{label}</span>
              <span>
                {hasData
                  ? `${Math.round(key === "protein" ? summary.protein_g : key === "carbs" ? summary.carbs_g : summary.fat_g)}g`
                  : "—"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-cream/80 overflow-hidden">
              <m.div
                className={`h-full rounded-full ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${hasData ? pct[key] : 0}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
