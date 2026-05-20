"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/primitives/sheet";
import { Button } from "@/components/primitives/button";
import { CALENDAR_CATEGORIES } from "@/lib/calendar/categories";
import type { CalendarCategory, CalendarEvent } from "@/lib/types";
import {
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
} from "@/hooks/use-calendar";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  ritualDate: string;
  editing?: CalendarEvent | null;
};

export function EventSheet({
  open,
  onClose,
  userId,
  ritualDate,
  editing,
}: Props) {
  const create = useCreateCalendarEvent(userId);
  const update = useUpdateCalendarEvent(userId);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CalendarCategory>("other");
  const [allDay, setAllDay] = useState(true);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setCategory(editing.category);
      setAllDay(editing.all_day);
    } else {
      setTitle("");
      setCategory("other");
      setAllDay(true);
    }
  }, [editing, open]);

  async function save() {
    if (!title.trim()) return;
    if (editing) {
      await update.mutateAsync({
        id: editing.id,
        patch: { title, category, all_day: allDay },
      });
    } else {
      await create.mutateAsync({
        ritual_date: ritualDate,
        title,
        category,
        all_day: allDay,
      });
    }
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()} title={editing ? "edit plan" : "add something gentle"}>
      <div className="space-y-4">
        <input
          className="w-full rounded-xl border border-beige/50 bg-cream/50 px-3 py-2 text-sm"
          placeholder="what feels right today?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {CALENDAR_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-full px-3 py-1 text-xs ${
                category === c.id
                  ? "bg-sage/20 text-ink"
                  : "bg-beige/30 text-whisper"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-whisper">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          all day (no clock pressure)
        </label>
        <Button className="w-full" onClick={() => void save()} disabled={!title.trim()}>
          {editing ? "save" : "add to your day"}
        </Button>
      </div>
    </Sheet>
  );
}
