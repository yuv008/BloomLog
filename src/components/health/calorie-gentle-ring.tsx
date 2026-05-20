"use client";

import { m } from "framer-motion";
import { calorieFrame } from "@/lib/health/copy";
import type { CalorieDisplay } from "@/lib/types";

export function CalorieGentleRing({
  calories,
  target,
  display,
}: {
  calories: number;
  target: number | null | undefined;
  display: CalorieDisplay;
}) {
  const pct = target && target > 0 ? Math.min(Math.round((calories / target) * 100), 130) : 0;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  if (display === "hidden" || !target) {
    return (
      <div className="text-center py-2">
        <p className="text-sm text-whisper">listening mode — no calorie guide</p>
        {calories > 0 && (
          <p className="text-xs text-whisper mt-1">about {calories} kcal logged gently</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--lavender-gray)"
          strokeWidth="8"
          opacity={0.25}
        />
        <m.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--sage)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </svg>
      <div className="text-center -mt-24 pt-24">
        {display === "open" ? (
          <p className="font-display text-2xl text-ink">
            {calories}
            <span className="text-sm text-whisper font-sans"> / ~{target}</span>
          </p>
        ) : (
          <p className="text-sm text-ink">{calorieFrame(pct)}</p>
        )}
        {display === "soft" && (
          <p className="text-xs text-whisper mt-1">~{calories} kcal · gentle guide ~{target}</p>
        )}
      </div>
    </div>
  );
}
