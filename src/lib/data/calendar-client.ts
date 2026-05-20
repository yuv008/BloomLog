"use client";

import { localStore } from "@/lib/storage/local";
import { todayKey, addDaysToRitualDate } from "@/lib/dates";
import { filterEventsForRange } from "@/lib/data/calendar-event-query";
import { expandRecurrenceInstances } from "@/lib/calendar/expand-recurrence";
import type {
  CalendarEvent,
  CalendarCategory,
  CalendarEventKind,
  CalendarEventStatus,
  RoutineTemplate,
  RecurrenceRule,
} from "@/lib/types";

import type {
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "@/lib/data/calendar-types";

export type {
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "@/lib/data/calendar-types";

function uid() {
  return crypto.randomUUID();
}

export async function getCalendarEventsRange(
  userId: string,
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  return filterEventsForRange(
    localStore.getCalendarEvents().filter(
      (e) => e.user_id === userId && e.status !== "archived"
    ),
    from,
    to
  );
}

export async function getCalendarDay(
  userId: string,
  date?: string
): Promise<CalendarEvent[]> {
  const d = date ?? todayKey(localStore.getProfile()?.timezone);
  const events = await getCalendarEventsRange(userId, d, d);
  const carry = await getCalendarEventsRange(
    userId,
    addDaysToRitualDate(d, -14),
    addDaysToRitualDate(d, -1)
  );
  const openFromYesterday = carry
    .filter(
      (e) =>
        e.status === "open" &&
        e.ritual_date < d &&
        (e.kind === "task" || e.kind === "routine_instance")
    )
    .sort(
      (a, b) =>
        a.ritual_date.localeCompare(b.ritual_date) ||
        a.priority - b.priority ||
        a.position_order - b.position_order
    )
    .slice(0, 3)
    .map((e) => ({
      ...e,
      source_meta: { ...e.source_meta, carryover: true },
    }));
  const merged = [...openFromYesterday, ...events];
  const seen = new Set<string>();
  return merged.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export async function getCalendarAgenda(
  userId: string,
  date?: string,
  limit = 3
): Promise<CalendarEvent[]> {
  const day = await getCalendarDay(userId, date);
  return day
    .filter((e) => e.status === "open")
    .sort((a, b) => a.priority - b.priority || a.position_order - b.position_order)
    .slice(0, limit);
}

export async function createCalendarEvent(
  userId: string,
  input: CreateCalendarEventInput
): Promise<CalendarEvent> {
  const title = input.title?.trim();
  if (!title) throw new Error("title required");
  const now = new Date().toISOString();
  const event: CalendarEvent = {
    id: uid(),
    user_id: userId,
    ritual_date: input.ritual_date,
    title,
    notes: input.notes ?? null,
    category: input.category ?? "other",
    kind: input.kind ?? "task",
    starts_at: input.starts_at ?? null,
    ends_at: input.ends_at ?? null,
    all_day: input.all_day ?? !input.starts_at,
    ritual_end_date: input.ritual_end_date ?? null,
    priority: input.priority ?? 1,
    status: "open",
    recurrence_rule_id: input.recurrence_rule_id ?? null,
    linked_quest_key: input.linked_quest_key ?? null,
    linked_food_log_id: null,
    linked_daily_entry_date: null,
    source_meta: input.source_meta ?? {},
    position_order: input.position_order ?? 0,
    completed_at: null,
    created_at: now,
    updated_at: now,
  };
  localStore.upsertCalendarEvent(event);
  return event;
}

export async function updateCalendarEvent(
  userId: string,
  id: string,
  patch: UpdateCalendarEventInput
): Promise<CalendarEvent | null> {
  const existing = localStore.getCalendarEvents().find(
    (e) => e.user_id === userId && e.id === id
  );
  if (!existing) return null;
  const updated: CalendarEvent = {
    ...existing,
    ...patch,
    title: patch.title?.trim() ?? existing.title,
    updated_at: new Date().toISOString(),
  };
  localStore.upsertCalendarEvent(updated);
  return updated;
}

export async function completeCalendarEvent(
  userId: string,
  id: string,
  date?: string
) {
  const event = await updateCalendarEvent(userId, id, {
    status: "done",
    completed_at: new Date().toISOString(),
  });
  if (!event) throw new Error("event not found");
  return { event, gardenGranted: false, questDone: false };
}

export async function skipCalendarEvent(userId: string, id: string) {
  return updateCalendarEvent(userId, id, { status: "skipped" });
}

export async function getRoutineTemplates(userId: string) {
  return localStore.getRoutineTemplates().filter((r) => r.user_id === userId && r.active);
}

export async function createRoutineTemplate(
  userId: string,
  input: {
    title: string;
    category?: CalendarCategory;
    emoji?: string;
  }
): Promise<RoutineTemplate> {
  const tpl: RoutineTemplate = {
    id: uid(),
    user_id: userId,
    title: input.title,
    category: input.category ?? "ritual",
    default_time: null,
    emoji: input.emoji ?? "🌿",
    garden_reward_key: null,
    active: true,
    created_at: new Date().toISOString(),
  };
  localStore.upsertRoutineTemplate(tpl);
  return tpl;
}

export async function getMonthIndicators(userId: string, month: string) {
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, "0")}`;
  const events = await getCalendarEventsRange(userId, from, to);
  const map: Record<string, { tasks: number; routines: number; memories: number; hydration: boolean }> = {};
  for (const e of events) {
    const key = e.ritual_date;
    if (!map[key]) map[key] = { tasks: 0, routines: 0, memories: 0, hydration: false };
    if (e.kind === "routine_instance") map[key].routines++;
    else if (e.status === "open") map[key].tasks++;
  }
  return map;
}

export async function getMoodByDateForMonth(userId: string, month: string) {
  void userId;
  void month;
  return {};
}

export async function createRecurrenceRule(
  userId: string,
  input: {
    frequency: RecurrenceRule["frequency"];
    starts_on: string;
    ends_on?: string | null;
    by_weekday?: number[];
    interval_count?: number;
    template: Record<string, unknown>;
    through?: string;
  }
) {
  const rule: RecurrenceRule = {
    id: uid(),
    user_id: userId,
    frequency: input.frequency,
    interval_count: input.interval_count ?? 1,
    by_weekday: input.by_weekday ?? [],
    starts_on: input.starts_on,
    ends_on: input.ends_on ?? null,
    template: input.template,
    last_generated_through: null,
    created_at: new Date().toISOString(),
  };
  localStore.upsertRecurrenceRule(rule);
  const through = input.through ?? addDaysToRitualDate(input.starts_on, 90);
  const drafts = expandRecurrenceInstances(rule, through, userId);
  const created: CalendarEvent[] = [];
  for (const draft of drafts) {
    const ev = await createCalendarEvent(userId, {
      ritual_date: draft.ritual_date,
      title: draft.title,
      notes: draft.notes,
      category: draft.category,
      kind: draft.kind,
      all_day: draft.all_day,
      priority: draft.priority,
      recurrence_rule_id: rule.id,
    });
    created.push({ ...ev, recurrence_rule_id: rule.id });
  }
  return { rule, instances: created };
}
