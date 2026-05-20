"use client";

import { hourInTimeZone } from "@/lib/dates";
import { timeBucket } from "@/lib/calendar/format";
import { EventCard } from "@/components/calendar/event-card";
import type { CalendarEvent, WellnessTimelineItem } from "@/lib/types";
import { DEFAULT_TIMEZONE } from "@/lib/locale/timezones";

const BUCKETS = [
  { key: "morning" as const, label: "morning" },
  { key: "afternoon" as const, label: "afternoon" },
  { key: "evening" as const, label: "evening" },
];

type Props = {
  events: CalendarEvent[];
  wellness?: WellnessTimelineItem[];
  timeZone?: string;
  onEventTap: (e: CalendarEvent) => void;
  onComplete: (id: string) => void;
};

export function DayTimeline({
  events,
  wellness = [],
  timeZone = DEFAULT_TIMEZONE,
  onEventTap,
  onComplete,
}: Props) {
  const allDay = events.filter((e) => e.all_day);
  const timed = events.filter((e) => !e.all_day && e.starts_at);
  const untimed = events.filter((e) => !e.all_day && !e.starts_at);

  const byBucket = BUCKETS.map((b) => ({
    ...b,
    items: timed.filter((e) => {
      const h = hourInTimeZone(new Date(e.starts_at!), timeZone);
      return timeBucket(h) === b.key;
    }),
    wellness: wellness.filter((_, i) => {
      if (b.key === "morning") return i % 3 === 0;
      if (b.key === "afternoon") return i % 3 === 1;
      return i % 3 === 2;
    }),
  }));

  const carryover = events.filter((e) => e.source_meta?.carryover);

  return (
    <div className="space-y-5">
      {carryover.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium text-blush/90">
            still open from yesterday
          </h3>
          <div className="space-y-2">
            {carryover.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                timeZone={timeZone}
                onTap={() => onEventTap(e)}
                onComplete={() => onComplete(e.id)}
              />
            ))}
          </div>
        </section>
      )}

      {(allDay.length > 0 || untimed.length > 0) && (
        <section>
          <h3 className="mb-2 text-xs text-whisper">all day</h3>
          <div className="space-y-2">
            {[...allDay, ...untimed].map((e) => (
              <EventCard
                key={e.id}
                event={e}
                timeZone={timeZone}
                onTap={() => onEventTap(e)}
                onComplete={() => onComplete(e.id)}
              />
            ))}
          </div>
        </section>
      )}

      {byBucket.map(
        (b) =>
          (b.items.length > 0 || b.wellness.length > 0) && (
            <section key={b.key}>
              <h3 className="mb-2 text-xs capitalize text-whisper">{b.label}</h3>
              <div className="space-y-2">
                {b.wellness.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-2xl border border-beige/20 bg-cream/30 px-3 py-2 text-xs text-whisper"
                  >
                    {w.title}
                    {w.timeLabel ? ` · ${w.timeLabel}` : ""}
                  </div>
                ))}
                {b.items.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    timeZone={timeZone}
                    onTap={() => onEventTap(e)}
                    onComplete={() => onComplete(e.id)}
                  />
                ))}
              </div>
            </section>
          )
      )}

      {events.length === 0 && wellness.length === 0 && (
        <p className="py-8 text-center text-sm text-whisper">
          a quiet day — tap + to add something gentle
        </p>
      )}
    </div>
  );
}
