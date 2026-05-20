"use client";

import { memo } from "react";
import {
  parseRitualDateOnly,
  toRitualDateString,
  monthLabel,
  eventOnRitualDate,
} from "@/lib/dates";
import { DEFAULT_TIMEZONE } from "@/lib/locale/timezones";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type DayIndicators = {
  tasks: number;
  routines: number;
  memories: number;
  hydration: boolean;
};

type Props = {
  month: string;
  selected: string;
  events: CalendarEvent[];
  indicators?: Record<string, DayIndicators>;
  moodByDate?: Record<string, string | null>;
  timeZone?: string;
  onSelect: (date: string) => void;
};

const DayCell = memo(function DayCell({
  date,
  inMonth,
  selected,
  events,
  indicators,
  mood,
  onSelect,
}: {
  date: string;
  inMonth: boolean;
  selected: boolean;
  events: CalendarEvent[];
  indicators?: DayIndicators;
  mood?: string | null;
  onSelect: (d: string) => void;
}) {
  const d = parseRitualDateOnly(date);
  const num = d?.getDate() ?? "";
  const dayEv = events.filter((e) =>
    eventOnRitualDate(e.ritual_date, e.ritual_end_date, date)
  );
  const openTasks = dayEv.filter((e) => e.status === "open" && e.kind !== "routine_instance").length;
  const routines = dayEv.filter((e) => e.kind === "routine_instance").length;

  return (
    <button
      type="button"
      disabled={!inMonth}
      onClick={() => inMonth && onSelect(date)}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs transition-colors",
        !inMonth && "opacity-20",
        selected && "ring-1 ring-sage/40 bg-sage/10",
        mood && inMonth && "bg-blush/5"
      )}
    >
      <span className={cn("font-medium", selected ? "text-ink" : "text-whisper")}>
        {num}
      </span>
      <div className="mt-0.5 flex gap-0.5">
        {openTasks > 0 && <span className="h-1 w-1 rounded-full bg-blush/70" />}
        {routines > 0 && <span className="h-1 w-1 rounded-full bg-sage/70" />}
        {(indicators?.memories ?? 0) > 0 && (
          <span className="h-1 w-1 rounded-full bg-amber-300/80" />
        )}
        {indicators?.hydration && (
          <span className="h-1 w-1 rounded-full bg-sky-300/60" />
        )}
      </div>
    </button>
  );
});

export function CozyMonthGrid({
  month,
  selected,
  events,
  indicators,
  moodByDate,
  timeZone = DEFAULT_TIMEZONE,
  onSelect,
}: Props) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: { date: string; inMonth: boolean }[] = [];

  for (let i = 0; i < startPad; i++) {
    const d = new Date(y, m - 1, 1 - (startPad - i));
    cells.push({ date: toRitualDateString(d), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: `${month}-${String(d).padStart(2, "0")}`,
      inMonth: true,
    });
  }
  while (cells.length % 7 !== 0) {
    const last = parseRitualDateOnly(cells[cells.length - 1].date)!;
    last.setDate(last.getDate() + 1);
    cells.push({ date: toRitualDateString(last), inMonth: false });
  }

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div>
      <p className="mb-2 text-center text-sm font-medium text-ink">
        {monthLabel(month, timeZone)}
      </p>
      <div className="mb-2 grid grid-cols-7 text-center text-[10px] text-whisper">
        {weekdays.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map(({ date, inMonth }) => (
          <DayCell
            key={date + String(inMonth)}
            date={date}
            inMonth={inMonth}
            selected={date === selected}
            events={events}
            indicators={indicators?.[date]}
            mood={moodByDate?.[date]}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

