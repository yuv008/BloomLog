import { createClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/storage/local";
import { todayKey, addDaysToRitualDate } from "@/lib/dates";
import { shouldUseSupabase } from "@/lib/data/auth-shared";
import {
  hasQuestGardenGrantedToday,
  markQuestGardenGrantedToday,
} from "@/lib/quests/quest-garden";
import { randomGardenReward } from "@/lib/garden/items";
import { isRareSeedRoll } from "@/lib/quests/pool";
import { expandRecurrenceInstances } from "@/lib/calendar/expand-recurrence";
import {
  normalizeEventTiming,
  buildStartsAtIso,
} from "@/lib/calendar/event-timing";
import { filterEventsForRange } from "@/lib/data/calendar-event-query";
import type {
  CalendarEvent,
  CalendarCategory,
  CalendarEventKind,
  CalendarEventStatus,
  RoutineTemplate,
  RecurrenceRule,
} from "@/lib/types";

function uid() {
  return crypto.randomUUID();
}

async function profileTz(userId: string): Promise<string | undefined> {
  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    const { data } = await supabase
      .from("users_profile")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    return data?.timezone as string | undefined;
  }
  return localStore.getProfile()?.timezone;
}

async function ritualToday(userId: string, date?: string) {
  if (date) return date;
  return todayKey(await profileTz(userId));
}

export type {
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "@/lib/data/calendar-types";
import type {
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "@/lib/data/calendar-types";

function rowToEvent(row: Record<string, unknown>): CalendarEvent {
  return row as unknown as CalendarEvent;
}

const PATCHABLE_COLUMNS = [
  "title",
  "notes",
  "category",
  "starts_at",
  "ends_at",
  "all_day",
  "ritual_date",
  "ritual_end_date",
  "priority",
  "status",
  "completed_at",
  "position_order",
  "updated_at",
] as const;

function pickPatchRow(
  patch: UpdateCalendarEventInput & { updated_at: string }
): Record<string, unknown> {
  const row: Record<string, unknown> = { updated_at: patch.updated_at };
  for (const key of PATCHABLE_COLUMNS) {
    if (key === "updated_at") continue;
    if (key in patch && patch[key as keyof typeof patch] !== undefined) {
      row[key] = patch[key as keyof typeof patch];
    }
  }
  return row;
}

export async function getCalendarEventById(
  userId: string,
  id: string
): Promise<CalendarEvent | null> {
  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .neq("status", "archived")
      .maybeSingle();
    if (!error && data) return rowToEvent(data);
  }
  return (
    localStore.getCalendarEvents().find((e) => e.user_id === userId && e.id === id) ??
    null
  );
}

export async function getCalendarEventsRange(
  userId: string,
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "archived")
      .lte("ritual_date", to)
      .or(`ritual_end_date.gte.${from},ritual_end_date.is.null`)
      .order("position_order")
      .order("starts_at", { nullsFirst: true });
    if (!error && data) {
      return filterEventsForRange(data.map(rowToEvent), from, to);
    }
  }
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
  const d = await ritualToday(userId, date);
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
): Promise<{ items: CalendarEvent[]; openCount: number }> {
  const day = await getCalendarDay(userId, date);
  const open = day
    .filter((e) => e.status === "open")
    .sort((a, b) => a.priority - b.priority || a.position_order - b.position_order);
  return {
    items: open.slice(0, limit),
    openCount: open.length,
  };
}

export async function createCalendarEvent(
  userId: string,
  input: CreateCalendarEventInput
): Promise<CalendarEvent> {
  const title = input.title?.trim();
  if (!title) throw new Error("title required");
  if (!input.ritual_date || !/^\d{4}-\d{2}-\d{2}$/.test(input.ritual_date)) {
    throw new Error("invalid ritual_date");
  }
  if (
    input.ritual_end_date &&
    input.ritual_end_date < input.ritual_date
  ) {
    throw new Error("ritual_end_date before ritual_date");
  }
  const tz = await profileTz(userId);
  const timing = normalizeEventTiming(
    {
      ritual_date: input.ritual_date,
      all_day: input.all_day,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
    },
    tz
  );
  const now = new Date().toISOString();
  const event: CalendarEvent = {
    id: uid(),
    user_id: userId,
    ritual_date: input.ritual_date,
    title,
    notes: input.notes ?? null,
    category: input.category ?? "other",
    kind: input.kind ?? "task",
    starts_at: timing.starts_at,
    ends_at: timing.ends_at,
    all_day: timing.all_day,
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

  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    const { data, error } = await supabase
      .from("calendar_events")
      .insert(event)
      .select()
      .single();
    if (!error && data) {
      const saved = rowToEvent(data);
      if (saved.starts_at) await maybeScheduleSoftReminder(userId, saved);
      return saved;
    }
  }
  localStore.upsertCalendarEvent(event);
  return event;
}

async function serverUpsertQuestCompletion(
  userId: string,
  questKey: string,
  date: string
) {
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.from("quest_completions").upsert(
    {
      id: uid(),
      user_id: userId,
      date,
      quest_key: questKey,
    },
    { onConflict: "user_id,date,quest_key" }
  );
}

async function serverAddGardenItem(
  userId: string,
  item_key: string,
  position: { x: number; y: number; layer: number }
) {
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.from("garden_items").insert({
    id: uid(),
    user_id: userId,
    item_key,
    acquired_at: new Date().toISOString(),
    position,
    bloom_stage: 0,
  });
}

async function maybeScheduleSoftReminder(
  userId: string,
  event: CalendarEvent
) {
  if (!event.starts_at || !shouldUseSupabase(userId)) return;
  const remindAt = new Date(
    new Date(event.starts_at).getTime() - 15 * 60_000
  ).toISOString();
  if (new Date(remindAt).getTime() <= Date.now()) return;
  const supabase = (await createClient())!;
  await supabase.from("calendar_reminders").delete().eq("event_id", event.id);
  await supabase.from("calendar_reminders").insert({
    user_id: userId,
    event_id: event.id,
    remind_at: remindAt,
    channel: "in_app",
  });
}

export async function updateCalendarEvent(
  userId: string,
  id: string,
  patch: UpdateCalendarEventInput
): Promise<CalendarEvent | null> {
  const existing = await getCalendarEventById(userId, id);
  if (!existing) return null;

  const tz = await profileTz(userId);
  const ritualDate = patch.ritual_date ?? existing.ritual_date;
  const timing =
    patch.all_day !== undefined || patch.starts_at !== undefined
      ? normalizeEventTiming(
          {
            ritual_date: ritualDate,
            all_day: patch.all_day ?? existing.all_day,
            starts_at:
              patch.starts_at !== undefined ? patch.starts_at : existing.starts_at,
            ends_at: patch.ends_at !== undefined ? patch.ends_at : existing.ends_at,
          },
          tz
        )
      : null;

  const startsChanged =
    timing !== null && timing.starts_at !== existing.starts_at;

  const updated: CalendarEvent = {
    ...existing,
    ...patch,
    ...(timing ?? {}),
    title: patch.title?.trim() ?? existing.title,
    updated_at: new Date().toISOString(),
  };

  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    const row = pickPatchRow({
      title: updated.title,
      notes: updated.notes,
      category: updated.category,
      starts_at: updated.starts_at,
      ends_at: updated.ends_at,
      all_day: updated.all_day,
      ritual_date: updated.ritual_date,
      ritual_end_date: updated.ritual_end_date,
      priority: updated.priority,
      status: updated.status,
      completed_at: updated.completed_at,
      position_order: updated.position_order,
      updated_at: updated.updated_at,
    });
    const { data, error } = await supabase
      .from("calendar_events")
      .update(row)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (!error && data) {
      const saved = rowToEvent(data);
      if (startsChanged) await maybeScheduleSoftReminder(userId, saved);
      return saved;
    }
  }
  localStore.upsertCalendarEvent(updated);
  return updated;
}

export async function archiveCalendarEvent(
  userId: string,
  id: string
): Promise<void> {
  await updateCalendarEvent(userId, id, { status: "archived" });
}

export async function completeCalendarEvent(
  userId: string,
  id: string,
  date?: string
): Promise<{ event: CalendarEvent; gardenGranted: boolean; questDone: boolean }> {
  const d = await ritualToday(userId, date);
  const existing = await getCalendarEventById(userId, id);
  if (!existing) throw new Error("event not found");
  if (existing.status === "done") {
    return { event: existing, gardenGranted: false, questDone: false };
  }

  const event = await updateCalendarEvent(userId, id, {
    status: "done",
    completed_at: new Date().toISOString(),
  });
  if (!event) throw new Error("update failed");

  let questDone = false;
  if (event.linked_quest_key) {
    await serverUpsertQuestCompletion(userId, event.linked_quest_key, d);
    questDone = true;
  }

  let gardenGranted = false;
  const rewardKey =
    (event.source_meta?.garden_reward_key as string | undefined) ??
    (event.kind === "routine_instance" ? "routine_bloom" : null);
  if (rewardKey && !hasQuestGardenGrantedToday(userId, d)) {
    markQuestGardenGrantedToday(userId, d);
    const rare = isRareSeedRoll(userId, d, event.id);
    const itemDef = randomGardenReward(event.id.charCodeAt(0), rare);
    const position = {
      x: 25 + (event.id.charCodeAt(1) % 50),
      y: 35 + (event.id.charCodeAt(2) % 30),
      layer: rare ? 2 : 1,
    };
    await serverAddGardenItem(userId, itemDef.key, position);
    gardenGranted = true;
  }

  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    await supabase.from("activity_log").insert({
      user_id: userId,
      ritual_date: d,
      action: "complete",
      entity_type: "calendar_event",
      entity_id: id,
      payload: { title: event.title },
    });
  }

  return { event, gardenGranted, questDone };
}

export async function skipCalendarEvent(
  userId: string,
  id: string
): Promise<CalendarEvent | null> {
  return updateCalendarEvent(userId, id, { status: "skipped" });
}

export async function getRoutineTemplates(
  userId: string
): Promise<RoutineTemplate[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    const { data, error } = await supabase
      .from("routine_templates")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .order("created_at");
    if (!error && data) return data as RoutineTemplate[];
  }
  return localStore.getRoutineTemplates().filter((r) => r.user_id === userId && r.active);
}

export async function createRoutineTemplate(
  userId: string,
  input: {
    title: string;
    category?: CalendarCategory;
    emoji?: string;
    garden_reward_key?: string | null;
    default_time?: string | null;
  }
): Promise<RoutineTemplate> {
  const tpl: RoutineTemplate = {
    id: uid(),
    user_id: userId,
    title: input.title,
    category: input.category ?? "ritual",
    default_time: input.default_time ?? null,
    emoji: input.emoji ?? "🌿",
    garden_reward_key: input.garden_reward_key ?? null,
    active: true,
    created_at: new Date().toISOString(),
  };
  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    const { data, error } = await supabase
      .from("routine_templates")
      .insert(tpl)
      .select()
      .single();
    if (!error && data) return data as RoutineTemplate;
  }
  localStore.upsertRoutineTemplate(tpl);
  return tpl;
}

export async function spawnRoutineForDate(
  userId: string,
  templateId: string,
  ritualDate: string
): Promise<CalendarEvent | null> {
  const templates = await getRoutineTemplates(userId);
  const tpl = templates.find((t) => t.id === templateId);
  if (!tpl) return null;
  const tz = await profileTz(userId);
  const timeStr = tpl.default_time?.slice(0, 5) ?? null;
  const starts_at =
    timeStr && /^\d{2}:\d{2}$/.test(timeStr)
      ? buildStartsAtIso(ritualDate, timeStr, tz)
      : null;
  return createCalendarEvent(userId, {
    ritual_date: ritualDate,
    title: tpl.title,
    category: tpl.category,
    kind: "routine_instance",
    all_day: !starts_at,
    starts_at,
    source_meta: {
      garden_reward_key: tpl.garden_reward_key,
      routine_id: tpl.id,
    },
  });
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
): Promise<{ rule: RecurrenceRule; instances: CalendarEvent[] }> {
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

  const through =
    input.through ?? addDaysToRitualDate(input.starts_on, 90);

  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    const { data, error } = await supabase
      .from("recurrence_rules")
      .insert(rule)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "rule insert failed");
    Object.assign(rule, data);
  } else {
    localStore.upsertRecurrenceRule(rule);
  }

  const instances = await expandRecurrenceForRule(userId, rule, through);
  return { rule, instances };
}

export async function expandRecurrenceForRule(
  userId: string,
  rule: RecurrenceRule,
  through: string
): Promise<CalendarEvent[]> {
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
    });
    if (shouldUseSupabase(userId)) {
      const supabase = (await createClient())!;
      await supabase
        .from("calendar_events")
        .update({ recurrence_rule_id: rule.id })
        .eq("id", ev.id);
    }
    created.push({ ...ev, recurrence_rule_id: rule.id });
  }

  rule.last_generated_through = through;
  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    await supabase
      .from("recurrence_rules")
      .update({ last_generated_through: through })
      .eq("id", rule.id);
  } else {
    localStore.upsertRecurrenceRule(rule);
  }
  return created;
}

export async function getMoodByDateForMonth(
  userId: string,
  month: string
): Promise<Record<string, string | null>> {
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, "0")}`;
  const map: Record<string, string | null> = {};
  if (shouldUseSupabase(userId)) {
    const supabase = (await createClient())!;
    const { data } = await supabase
      .from("daily_entries")
      .select("date, mood")
      .eq("user_id", userId)
      .gte("date", from)
      .lte("date", to);
    for (const row of data ?? []) {
      map[row.date as string] = (row.mood as string | null) ?? null;
    }
    return map;
  }
  const all = readLocalDailyRange(from, to);
  return all;
}

function readLocalDailyRange(from: string, to: string): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  if (typeof window === "undefined") return map;
  try {
    const raw = localStorage.getItem("bloomlog_daily");
    if (!raw) return map;
    const daily = JSON.parse(raw) as Record<string, { mood?: string | null }>;
    for (const [date, entry] of Object.entries(daily)) {
      if (date >= from && date <= to) map[date] = entry.mood ?? null;
    }
  } catch {
    /* ignore */
  }
  return map;
}

export async function getMonthIndicators(
  userId: string,
  month: string
): Promise<
  Record<
    string,
    { tasks: number; routines: number; memories: number; hydration: boolean }
  >
> {
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, "0")}`;
  const events = await getCalendarEventsRange(userId, from, to);
  const map: Record<
    string,
    { tasks: number; routines: number; memories: number; hydration: boolean }
  > = {};

  for (const e of events) {
    const key = e.ritual_date;
    if (!map[key]) map[key] = { tasks: 0, routines: 0, memories: 0, hydration: false };
    if (e.kind === "routine_instance") map[key].routines++;
    else if (e.status === "open") map[key].tasks++;
  }

  return map;
}
