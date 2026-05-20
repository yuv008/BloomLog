"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/primitives/sheet";
import { Button } from "@/components/primitives/button";
import { CALENDAR_CATEGORIES } from "@/lib/calendar/categories";
import {
  buildStartsAtIso,
  parseTimeFromStartsAt,
} from "@/lib/calendar/event-timing";
import { useUserPreferences } from "@/components/providers/user-preferences";
import type { CalendarCategory, CalendarEvent } from "@/lib/types";
import {
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  useSkipCalendarEvent,
} from "@/hooks/use-calendar";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  ritualDate: string;
  editing?: CalendarEvent | null;
  editingLoading?: boolean;
};

export function EventSheet({
  open,
  onClose,
  userId,
  ritualDate,
  editing,
  editingLoading = false,
}: Props) {
  const { timezone } = useUserPreferences();
  const create = useCreateCalendarEvent(userId);
  const update = useUpdateCalendarEvent(userId);
  const remove = useDeleteCalendarEvent(userId);
  const skip = useSkipCalendarEvent(userId, ritualDate);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<CalendarCategory>("other");
  const [allDay, setAllDay] = useState(true);
  const [time, setTime] = useState("09:00");
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editing;
  const readOnly =
    editing?.status === "done" || editing?.status === "skipped";
  const pending =
    create.isPending ||
    update.isPending ||
    remove.isPending ||
    skip.isPending;

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setNotes(editing.notes ?? "");
      setCategory(editing.category);
      setAllDay(editing.all_day);
      setTime(parseTimeFromStartsAt(editing.starts_at, timezone));
    } else if (open) {
      setTitle("");
      setNotes("");
      setCategory("other");
      setAllDay(true);
      setTime("09:00");
    }
    setError(null);
  }, [editing, open, timezone]);

  function buildPayload() {
    const starts_at = allDay
      ? null
      : buildStartsAtIso(ritualDate, time, timezone);
    return {
      ritual_date: ritualDate,
      title: title.trim(),
      notes: notes.trim() || null,
      category,
      all_day: allDay,
      starts_at,
      ends_at: null as string | null,
    };
  }

  async function save() {
    if (!title.trim()) return;
    if (isEdit && !editing) return;
    setError(null);
    try {
      const payload = buildPayload();
      if (isEdit && editing) {
        await update.mutateAsync({
          id: editing.id,
          patch: payload,
        });
      } else if (!editingLoading) {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not save");
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm("remove this from your day?")) return;
    setError(null);
    try {
      await remove.mutateAsync(editing.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not remove");
    }
  }

  async function handleSkip() {
    if (!editing) return;
    setError(null);
    try {
      await skip.mutateAsync(editing.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not skip");
    }
  }

  const canSave =
    !!title.trim() &&
    !pending &&
    !readOnly &&
    !(editingLoading && isEdit) &&
    (!isEdit || !!editing);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={isEdit ? "edit plan" : "add something gentle"}
    >
      <div className="space-y-4">
        {editingLoading && isEdit && (
          <p className="text-xs text-whisper">loading your plan…</p>
        )}

        {editing?.source_meta?.carryover === true && (
          <p className="text-xs text-blush/80">still open from a previous day</p>
        )}

        {editing?.recurrence_rule_id && (
          <p className="text-xs text-whisper">
            part of a repeating plan — changes apply to this day only
          </p>
        )}

        {readOnly && (
          <p className="text-xs text-whisper">
            this one is {editing?.status} — you can still remove it if you like
          </p>
        )}

        <input
          className="w-full rounded-xl border border-beige/50 bg-cream/50 px-3 py-2 text-sm disabled:opacity-60"
          placeholder="what feels right today?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={readOnly}
        />

        <textarea
          className="w-full rounded-xl border border-beige/50 bg-cream/50 px-3 py-2 text-sm min-h-[72px] disabled:opacity-60"
          placeholder="a gentle note (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={readOnly}
        />

        <div className="flex flex-wrap gap-2">
          {CALENDAR_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={readOnly}
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
            disabled={readOnly}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          all day (no clock pressure)
        </label>

        {!allDay && (
          <label className="block text-sm text-whisper">
            <span className="mb-1 block">what time feels right?</span>
            <input
              type="time"
              value={time}
              disabled={readOnly}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-beige/50 bg-cream/50 px-3 py-2 text-sm"
            />
          </label>
        )}

        {error && <p className="text-xs text-blush">{error}</p>}

        <Button
          className="w-full"
          onClick={() => void save()}
          disabled={!canSave}
        >
          {isEdit ? "save" : "add to your day"}
        </Button>

        {isEdit && editing && (
          <div className="flex flex-col gap-2 pt-1">
            {editing.status === "open" && (
              <Button
                variant="ghost"
                className="w-full text-whisper"
                disabled={pending}
                onClick={() => void handleSkip()}
              >
                skip for today
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full text-blush/90 hover:text-blush"
              disabled={pending}
              onClick={() => void handleDelete()}
            >
              remove from day
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
