import type { CalendarEvent } from "@/lib/types";
import { eventOnRitualDate } from "@/lib/dates";

/** True if event should appear on any ritual day in [from, to] (inclusive). */
export function eventOverlapsRange(
  event: Pick<CalendarEvent, "ritual_date" | "ritual_end_date">,
  from: string,
  to: string
): boolean {
  const end = event.ritual_end_date ?? event.ritual_date;
  if (end < from || event.ritual_date > to) return false;
  return true;
}

/** True if event is visible on a single ritual day. */
export function eventVisibleOnDay(
  event: Pick<CalendarEvent, "ritual_date" | "ritual_end_date">,
  day: string
): boolean {
  return eventOnRitualDate(event.ritual_date, event.ritual_end_date, day);
}

export function filterEventsForRange(
  events: CalendarEvent[],
  from: string,
  to: string
): CalendarEvent[] {
  return events.filter((e) => eventOverlapsRange(e, from, to));
}

export function filterEventsForDay(
  events: CalendarEvent[],
  day: string
): CalendarEvent[] {
  return events.filter((e) => eventVisibleOnDay(e, day));
}
