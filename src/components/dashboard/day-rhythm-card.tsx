"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card } from "@/components/primitives/card";
import { useCalendarAgenda } from "@/hooks/use-calendar";
import { useUserPreferences } from "@/components/providers/user-preferences";
import { formatEventTime } from "@/lib/calendar/format";
import { categoryMeta } from "@/lib/calendar/categories";
import { useTodayKey } from "@/hooks/use-bloom-data";

export function DayRhythmCard({ userId }: { userId: string }) {
  const { date } = useTodayKey();
  const { timezone } = useUserPreferences();
  const { data, isLoading } = useCalendarAgenda(userId, date);
  const items = data?.items ?? [];
  const openCount = data?.openCount ?? items.length;
  const moreCount = Math.max(0, openCount - items.length);

  return (
    <Card className="glass-card border-beige/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sage" strokeWidth={1.5} />
          <h2 className="text-sm font-medium text-ink">your rhythm today</h2>
        </div>
        <Link
          href="/calendar"
          className="text-xs text-sage hover:text-ink transition-colors"
        >
          see your day →
        </Link>
      </div>

      {isLoading && (
        <p className="mt-3 text-xs text-whisper">gathering your gentle plans…</p>
      )}

      {!isLoading && items.length === 0 && (
        <p className="mt-3 text-xs text-whisper">
          nothing scheduled yet — add something cozy on your calendar
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {items.map((e) => {
          const meta = categoryMeta(e.category);
          const time = formatEventTime(e.starts_at, e.all_day, timezone);
          return (
            <li key={e.id} className="flex items-center gap-2 text-sm">
              <span>{meta.emoji}</span>
              <span className="truncate text-ink">{e.title}</span>
              <span className="ml-auto shrink-0 text-xs text-whisper">{time}</span>
            </li>
          );
        })}
      </ul>

      {moreCount > 0 && (
        <Link
          href="/calendar"
          className="mt-2 block text-xs text-sage hover:text-ink"
        >
          +{moreCount} more on your calendar →
        </Link>
      )}
    </Card>
  );
}
