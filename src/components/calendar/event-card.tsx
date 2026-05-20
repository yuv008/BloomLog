"use client";

import { motion } from "framer-motion";
import { categoryMeta, PRIORITY_LABELS } from "@/lib/calendar/categories";
import { formatEventTime } from "@/lib/calendar/format";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  event: CalendarEvent;
  timeZone: string;
  onTap?: () => void;
  onComplete?: () => void;
  compact?: boolean;
};

export function EventCard({
  event,
  timeZone,
  onTap,
  onComplete,
  compact,
}: Props) {
  const meta = categoryMeta(event.category);
  const done = event.status === "done";
  const skipped = event.status === "skipped";
  const time = formatEventTime(event.starts_at, event.all_day, timeZone);

  return (
    <motion.div
      layout
      className={cn(
        "glass-card rounded-2xl border border-beige/30 p-3 transition-opacity",
        done && "opacity-60",
        skipped && "opacity-40"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={done ? "completed" : "mark done"}
          disabled={done || skipped}
          onClick={(e) => {
            e.stopPropagation();
            onComplete?.();
          }}
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-sage/50",
            done && "border-sage bg-sage/30"
          )}
        />
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onTap}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{meta.emoji}</span>
            <span
              className={cn(
                "truncate text-sm font-medium text-ink",
                done && "line-through decoration-beige"
              )}
            >
              {event.title}
            </span>
          </div>
          {!compact && (
            <p className="mt-0.5 text-xs text-whisper">
              {time}
              {event.priority > 1 && ` · ${PRIORITY_LABELS[event.priority]}`}
            </p>
          )}
          {event.ritual_date && event.source_meta?.carryover === true && (
            <p className="mt-1 text-xs text-blush/80">still open from yesterday</p>
          )}
        </button>
      </div>
    </motion.div>
  );
}
