"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import type { FoodLogEntry, MemoryPolaroid } from "@/lib/types";
import { useUiStore } from "@/stores/use-ui-store";
import { MealPolaroidPhoto } from "@/components/food/food-photo-timeline";
import { MEAL_SLOTS } from "@/lib/health/slots";
import { FOOD_TAGS } from "@/lib/food/tags";
import { formatRitualDayLabel } from "@/lib/dates";
import { useUserPreferences } from "@/components/providers/user-preferences";

function polaroidSummary(payload: Record<string, unknown>, kind: string) {
  const label = typeof payload.label === "string" ? payload.label : kind.replace(/_/g, " ");
  const cozyDays = payload.cozy_days;
  if (typeof cozyDays === "number") {
    return `${label} · ${cozyDays} gentle day${cozyDays === 1 ? "" : "s"}`;
  }
  return label;
}

function mealSlotEmoji(slot: FoodLogEntry["meal_slot"]) {
  return MEAL_SLOTS.find((s) => s.id === slot)?.emoji ?? "🍽️";
}

function MealPolaroidCard({
  entry,
  index,
  flipped,
  onToggle,
}: {
  entry: FoodLogEntry;
  index: number;
  flipped: boolean;
  onToggle: () => void;
}) {
  const { timezone } = useUserPreferences();
  const dayLabel = formatRitualDayLabel(new Date(entry.date + "T12:00:00"), timezone);

  return (
    <m.button
      type="button"
      onClick={onToggle}
      className="shrink-0 w-56"
      style={{ rotate: index % 2 === 0 ? -2 : 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <AnimatePresence mode="wait">
        <m.div
          key={flipped ? "back" : "front"}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          className="rounded-[12px] bg-cream border-4 border-white shadow-lg p-3 min-h-[200px] flex flex-col"
        >
          {flipped ? (
            <div className="text-sm text-ink space-y-2 overflow-hidden flex-1">
              <p className="font-display text-lg break-words">{entry.name}</p>
              <p className="text-whisper text-xs">
                {dayLabel} · {mealSlotEmoji(entry.meal_slot)}
              </p>
              {entry.emotional_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.emotional_tags.map((t) => {
                    const tag = FOOD_TAGS.find((x) => x.id === t);
                    return (
                      <span
                        key={t}
                        className="rounded-full bg-beige/60 px-2 py-0.5 text-[10px] text-ink"
                      >
                        {tag?.emoji} {tag?.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="relative flex-1 min-h-[140px] rounded-[8px] overflow-hidden bg-beige/20">
                <MealPolaroidPhoto entry={entry} />
              </div>
              <p className="mt-2 text-xs text-ink truncate text-center">{entry.name}</p>
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </m.button>
  );
}

function MemoryPolaroidCard({
  polaroid,
  index,
  flipped,
  onToggle,
}: {
  polaroid: MemoryPolaroid;
  index: number;
  flipped: boolean;
  onToggle: () => void;
}) {
  return (
    <m.button
      type="button"
      onClick={onToggle}
      className="shrink-0 w-56"
      style={{ rotate: index % 2 === 0 ? -2 : 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <AnimatePresence mode="wait">
        <m.div
          key={flipped ? "back" : "front"}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          className="rounded-[12px] bg-cream border-4 border-white shadow-lg p-4 min-h-[200px]"
        >
          {flipped ? (
            <div className="text-sm text-ink space-y-2 overflow-hidden">
              <p className="font-display text-lg break-words">
                {(polaroid.payload as { label?: string }).label ?? polaroid.kind}
              </p>
              <p className="text-whisper text-xs">
                {polaroid.period_start} — {polaroid.period_end}
              </p>
              <p className="text-xs text-whisper break-words">
                {polaroidSummary(polaroid.payload as Record<string, unknown>, polaroid.kind)}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-display text-lg text-ink">
                {(polaroid.payload as { label?: string }).label ??
                  polaroid.kind.replace("_", " ")}
              </p>
              <p className="text-4xl mt-8 text-center">
                {polaroid.kind === "cozy_week"
                  ? "🪟"
                  : polaroid.kind === "soft_sleep"
                    ? "🌙"
                    : "🌸"}
              </p>
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </m.button>
  );
}

export function MemoryShelf({
  polaroids,
  mealPolaroids = [],
}: {
  polaroids: MemoryPolaroid[];
  mealPolaroids?: FoodLogEntry[];
}) {
  const [flipped, setFlipped] = useState<string | null>(null);
  const setViewedShelf = useUiStore((s) => s.setViewedShelf);
  const total = mealPolaroids.length + polaroids.length;

  useEffect(() => {
    setViewedShelf(true);
  }, [setViewedShelf]);

  if (total === 0) {
    return (
      <div className="glass-card p-8 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <p className="font-display text-xl text-ink">memory shelf</p>
        <p className="text-sm text-whisper mt-2 max-w-xs">
          meal polaroids from nourish land here. weekly memories appear at week&apos;s end too.
        </p>
      </div>
    );
  }

  let index = 0;

  return (
    <div className="space-y-6 py-4 w-full min-w-0 max-w-full overflow-hidden">
      <div className="px-2">
        <p className="font-display text-2xl text-ink">memory shelf</p>
        {mealPolaroids.length > 0 && (
          <p className="text-sm text-whisper mt-1">
            {mealPolaroids.length} meal polaroid{mealPolaroids.length === 1 ? "" : "s"} · tap to
            flip
          </p>
        )}
      </div>
      <div className="w-full max-w-full min-w-0 overflow-x-auto no-scrollbar -mx-2 px-2 pb-8">
        <div className="flex gap-4 w-max min-w-full">
          {mealPolaroids.map((entry) => {
            const i = index++;
            return (
              <MealPolaroidCard
                key={`meal-${entry.id}`}
                entry={entry}
                index={i}
                flipped={flipped === `meal-${entry.id}`}
                onToggle={() =>
                  setFlipped(flipped === `meal-${entry.id}` ? null : `meal-${entry.id}`)
                }
              />
            );
          })}
          {polaroids.map((p) => {
            const i = index++;
            return (
              <MemoryPolaroidCard
                key={p.id}
                polaroid={p}
                index={i}
                flipped={flipped === p.id}
                onToggle={() => setFlipped(flipped === p.id ? null : p.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
