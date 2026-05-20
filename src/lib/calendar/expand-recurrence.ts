import { addDaysToRitualDate } from "@/lib/dates";
import type { CalendarEvent, RecurrenceRule } from "@/lib/types";

const MAX_INSTANCES = 52;

function weeksBetween(start: string, end: string): number {
  const s = new Date(start + "T12:00:00").getTime();
  const e = new Date(end + "T12:00:00").getTime();
  return Math.floor((e - s) / (7 * 24 * 60 * 60 * 1000));
}

function monthsBetween(start: string, end: string): number {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  return (ey - sy) * 12 + (em - sm);
}

function matchesWeekday(date: string, weekdays: number[]): boolean {
  if (!weekdays.length) return true;
  const d = new Date(date + "T12:00:00");
  return weekdays.includes(d.getDay());
}

function nextOccurrence(
  cursor: string,
  rule: RecurrenceRule
): string | null {
  const { frequency, interval_count, by_weekday, ends_on } = rule;
  let next = cursor;
  for (let guard = 0; guard < 400; guard++) {
    if (frequency === "daily") {
      next = addDaysToRitualDate(next, interval_count);
    } else if (frequency === "weekly") {
      next = addDaysToRitualDate(next, 1);
    } else {
      next = addDaysToRitualDate(next, 1);
    }
    if (ends_on && next > ends_on) return null;
    if (frequency === "weekly") {
      if (!matchesWeekday(next, by_weekday)) continue;
      const weeksSince = weeksBetween(rule.starts_on, next);
      if (weeksSince % interval_count !== 0) continue;
      return next;
    }
    if (frequency === "monthly") {
      const targetDay = rule.starts_on.slice(8, 10);
      if (next.slice(8, 10) !== targetDay) continue;
      const monthsSince = monthsBetween(rule.starts_on, next);
      if (monthsSince % interval_count !== 0) continue;
      return next;
    }
    return next;
  }
  return null;
}

export function expandRecurrenceInstances(
  rule: RecurrenceRule,
  through: string,
  userId: string
): Omit<CalendarEvent, "id" | "created_at" | "updated_at">[] {
  const tpl = rule.template as {
    title?: string;
    category?: CalendarEvent["category"];
    kind?: CalendarEvent["kind"];
    all_day?: boolean;
    priority?: number;
    notes?: string;
  };
  const instances: Omit<CalendarEvent, "id" | "created_at" | "updated_at">[] = [];
  let cursor = rule.starts_on;
  const startFrom = rule.last_generated_through
    ? addDaysToRitualDate(rule.last_generated_through, 1)
    : rule.starts_on;
  cursor = startFrom;

  while (cursor <= through && instances.length < MAX_INSTANCES) {
    if (cursor >= rule.starts_on && (!rule.ends_on || cursor <= rule.ends_on)) {
      if (frequencyMatches(rule, cursor)) {
        instances.push({
          user_id: userId,
          ritual_date: cursor,
          title: tpl.title ?? "routine",
          notes: tpl.notes ?? null,
          category: (tpl.category as CalendarEvent["category"]) ?? "ritual",
          kind: tpl.kind ?? "routine_instance",
          starts_at: null,
          ends_at: null,
          all_day: tpl.all_day ?? true,
          ritual_end_date: null,
          priority: tpl.priority ?? 1,
          status: "open",
          recurrence_rule_id: rule.id,
          linked_quest_key: null,
          linked_food_log_id: null,
          linked_daily_entry_date: null,
          source_meta: { source: "recurrence" },
          position_order: 0,
          completed_at: null,
        });
      }
    }
    const n = nextOccurrence(cursor, rule);
    if (!n || n === cursor) break;
    cursor = n;
  }
  return instances;
}

function frequencyMatches(rule: RecurrenceRule, date: string): boolean {
  if (rule.frequency === "daily") return true;
  if (rule.frequency === "weekly") return matchesWeekday(date, rule.by_weekday);
  if (rule.frequency === "monthly") {
    return date.slice(8, 10) === rule.starts_on.slice(8, 10);
  }
  return true;
}
