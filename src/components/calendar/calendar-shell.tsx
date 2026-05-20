"use client";

import { MoodSkyBackground } from "@/components/mood/mood-sky";
import { StreakFlower } from "@/components/calendar/streak-flower";
import type { CalendarEvent, Mood } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DEFAULT_TIMEZONE } from "@/lib/locale/timezones";

type Props = {
  selectedDate: string;
  timeZone?: string;
  mood?: Mood | null;
  view: "day" | "week" | "month";
  headerLabel: string;
  showToday?: boolean;
  onToday?: () => void;
  onViewChange: (v: "day" | "week" | "month") => void;
  onPrev?: () => void;
  onNext?: () => void;
  weekEvents?: CalendarEvent[];
  children: React.ReactNode;
};

export function CalendarShell({
  selectedDate,
  timeZone = DEFAULT_TIMEZONE,
  mood,
  view,
  headerLabel,
  showToday = false,
  onToday,
  onViewChange,
  onPrev,
  onNext,
  weekEvents = [],
  children,
}: Props) {
  void selectedDate;
  void timeZone;

  return (
    <div className="relative min-h-[60vh]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <MoodSkyBackground mood={mood ?? null} />
      </div>
      <div className="relative z-10 space-y-4">
        <header className="space-y-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              className="shrink-0 px-2 py-1 text-whisper"
              aria-label="previous"
            >
              ←
            </button>
            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-lg font-medium text-ink">your rhythm</h1>
              <p className="truncate text-xs text-whisper">{headerLabel}</p>
            </div>
            {showToday && onToday && (
              <button
                type="button"
                onClick={onToday}
                className="shrink-0 rounded-full bg-sage/15 px-2.5 py-1 text-[10px] font-medium text-sage"
              >
                today
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="shrink-0 px-2 py-1 text-whisper"
              aria-label="next"
            >
              →
            </button>
          </div>
          <div className="flex justify-center gap-1 rounded-full bg-cream/60 p-1">
            {(["week", "day", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onViewChange(v)}
                className={cn(
                  "rounded-full px-4 py-1 text-xs capitalize",
                  view === v ? "bg-sage/20 text-ink" : "text-whisper"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          {weekEvents.length > 0 && view === "week" && (
            <StreakFlower events={weekEvents} />
          )}
        </header>
        {children}
      </div>
    </div>
  );
}
