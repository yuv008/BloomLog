"use client";

import type { CalendarEvent } from "@/lib/types";

/** Gentle weekly routine streak — no harsh loss messaging */
export function StreakFlower({ events }: { events: CalendarEvent[] }) {
  const doneRoutines = events.filter(
    (e) => e.kind === "routine_instance" && e.status === "done"
  ).length;
  const stage = Math.min(5, doneRoutines);
  const petals = ["🌱", "🌿", "🌸", "🌼", "🌺"];
  const emoji = petals[stage] ?? petals[0];

  return (
    <div className="flex items-center gap-2 rounded-full bg-cream/50 px-3 py-1 text-xs text-whisper">
      <span aria-hidden>{emoji}</span>
      <span>
        {doneRoutines === 0
          ? "your week is unfolding gently"
          : `${doneRoutines} ritual${doneRoutines === 1 ? "" : "s"} blooming this week`}
      </span>
    </div>
  );
}
