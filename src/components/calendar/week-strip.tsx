"use client";

import { useEffect, useRef } from "react";
import { eventOnRitualDate, isRitualToday } from "@/lib/dates";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DEFAULT_TIMEZONE } from "@/lib/locale/timezones";

type Props = {
  days: string[];
  selected: string;
  events: CalendarEvent[];
  timeZone?: string;
  onSelect: (date: string) => void;
};

function dayLabel(dateStr: string, timeZone: string) {
  const d = new Date(dateStr + "T12:00:00");
  const dow = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(d);
  const num = new Intl.DateTimeFormat("en-US", {
    timeZone,
    day: "numeric",
  }).format(d);
  return { dow, num };
}

export function WeekStrip({
  days,
  selected,
  events,
  timeZone = DEFAULT_TIMEZONE,
  onSelect,
}: Props) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [selected]);

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {days.map((d) => {
        const { dow, num } = dayLabel(d, timeZone);
        const dayEvents = events.filter((e) =>
          eventOnRitualDate(e.ritual_date, e.ritual_end_date, d)
        );
        const open = dayEvents.filter((e) => e.status === "open").length;
        const active = d === selected;
        const isToday = isRitualToday(d, timeZone);
        return (
          <button
            key={d}
            ref={active ? selectedRef : undefined}
            type="button"
            onClick={() => onSelect(d)}
            className={cn(
              "flex min-w-[3rem] flex-col items-center rounded-2xl px-2 py-2 transition-colors",
              active && "bg-sage/15 text-ink",
              !active && "text-whisper",
              isToday && !active && "ring-1 ring-sage/30"
            )}
          >
            <span className="text-[10px] uppercase tracking-wide">{dow}</span>
            <span
              className={cn(
                "text-lg font-medium",
                isToday && "text-sage"
              )}
            >
              {num}
            </span>
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: Math.min(open, 4) }).map((_, i) => (
                <span key={i} className="h-1 w-1 rounded-full bg-blush/70" />
              ))}
              {open > 4 && (
                <span className="text-[9px] text-whisper">+{open - 4}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
