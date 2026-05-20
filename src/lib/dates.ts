import { format, startOfWeek, endOfWeek, subDays, endOfMonth } from "date-fns";
import { DEFAULT_TIMEZONE } from "@/lib/locale/timezones";

function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
  };
}

export function dateInTimeZone(date: Date, timeZone = DEFAULT_TIMEZONE): string {
  const { year, month, day } = zonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayKey(timeZone = DEFAULT_TIMEZONE): string {
  return dateInTimeZone(new Date(), timeZone);
}

export function monthKey(date = new Date(), timeZone = DEFAULT_TIMEZONE): string {
  const { year, month } = zonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthDateRange(month = monthKey(), timeZone = DEFAULT_TIMEZONE) {
  const [year, monthNum] = month.split("-").map(Number);
  const start = new Date(year, monthNum - 1, 1);
  const end = endOfMonth(start);
  return {
    start: dateInTimeZone(start, timeZone),
    end: dateInTimeZone(end, timeZone),
  };
}

export function monthLabel(month = monthKey(), timeZone = DEFAULT_TIMEZONE): string {
  const [year, monthNum] = month.split("-").map(Number);
  return format(new Date(year, monthNum - 1, 1), "MMMM yyyy");
}

export function weekRange(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  return {
    start: dateInTimeZone(startOfWeek(date, { weekStartsOn: 1 }), timeZone),
    end: dateInTimeZone(endOfWeek(date, { weekStartsOn: 1 }), timeZone),
  };
}

export function last7Days(timeZone = DEFAULT_TIMEZONE): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    dateInTimeZone(subDays(new Date(), 6 - i), timeZone)
  );
}

/** Full ritual day label, e.g. "Wednesday, May 20" */
export function formatRitualDayLabel(
  date = new Date(),
  timeZone = DEFAULT_TIMEZONE
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Soft contextual whisper for the day-of-week */
export function ritualDayWhisper(timeZone = DEFAULT_TIMEZONE): string | null {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(new Date());
  if (weekday === "Wednesday") return "midweek";
  if (weekday === "Saturday" || weekday === "Sunday") return "weekend soon";
  if (weekday === "Monday") return "gentle start";
  return null;
}

/** Milliseconds until next midnight in the given IANA timezone */
export function msUntilMidnightInTz(timeZone = DEFAULT_TIMEZONE): number {
  const now = new Date();
  const today = dateInTimeZone(now, timeZone);
  const [y, m, d] = today.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d + 1, 0, 5, 0));
  let lo = probe.getTime() - 48 * 60 * 60 * 1000;
  let hi = probe.getTime() + 48 * 60 * 60 * 1000;
  while (hi - lo > 60_000) {
    const mid = Math.floor((lo + hi) / 2);
    if (dateInTimeZone(new Date(mid), timeZone) === today) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return Math.max(60_000, hi - now.getTime() + 1000);
}

export function hourInTimeZone(date: Date, timeZone = DEFAULT_TIMEZONE): number {
  return zonedParts(date, timeZone).hour;
}

/** UTC instants bounding a ritual calendar day in the given IANA timezone */
export function ritualDayBoundsUtc(date: string, timeZone = DEFAULT_TIMEZONE) {
  const [y, m, d] = date.split("-").map(Number);
  let lo = Date.UTC(y, m - 1, d, 0, 0, 0) - 48 * 60 * 60 * 1000;
  let hi = Date.UTC(y, m - 1, d + 2, 0, 0, 0);

  // Earliest instant still on `date` in `timeZone` (start of ritual day)
  let startLo = lo;
  let startHi = hi;
  while (startHi - startLo > 60_000) {
    const mid = Math.floor((startLo + startHi) / 2);
    if (dateInTimeZone(new Date(mid), timeZone) === date) startHi = mid;
    else startLo = mid;
  }
  const dayStart = startHi;

  // First instant after the ritual day (exclusive end)
  let endLo = dayStart;
  let endHi = hi;
  while (endHi - endLo > 60_000) {
    const mid = Math.floor((endLo + endHi) / 2);
    if (dateInTimeZone(new Date(mid), timeZone) === date) endLo = mid;
    else endHi = mid;
  }

  return {
    timeMin: new Date(dayStart).toISOString(),
    timeMax: new Date(endHi).toISOString(),
  };
}

/** True for canonical ritual day keys (YYYY-MM-DD). */
export function isRitualDateKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** Parse YYYY-MM-DD without UTC day shift (from ai_school dateUtils pattern) */
export function parseRitualDateOnly(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (
    isNaN(d.getTime()) ||
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

export function toRitualDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToRitualDate(dateStr: string, days: number): string {
  const d = parseRitualDateOnly(dateStr);
  if (!d) return dateStr;
  d.setDate(d.getDate() + days);
  return toRitualDateString(d);
}

/** YYYY-MM from a ritual date string (no timezone drift). */
export function ritualMonthKeyFromDate(
  dateStr: string,
  timeZone = DEFAULT_TIMEZONE
): string {
  if (!isRitualDateKey(dateStr)) return monthKey(new Date(), timeZone);
  return dateStr.slice(0, 7);
}

export function addMonthsToMonthKey(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const year = Math.floor(total / 12);
  const monthNum = (total % 12) + 1;
  return `${year}-${String(monthNum).padStart(2, "0")}`;
}

export function firstDayOfMonth(month: string): string {
  return `${month}-01`;
}

export function weekStartFromAnchor(anchor: string): string {
  return weekDatesAround(anchor).start;
}

export function shiftWeekByDelta(anchor: string, deltaWeeks: number): string {
  const start = weekStartFromAnchor(anchor);
  return addDaysToRitualDate(start, deltaWeeks * 7);
}

export function formatWeekRangeLabel(
  start: string,
  end: string,
  timeZone = DEFAULT_TIMEZONE
): string {
  const startDate = parseRitualDateOnly(start);
  const endDate = parseRitualDateOnly(end);
  if (!startDate || !endDate) return `${start} – ${end}`;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
  });
  const yearFmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
  });
  const startLabel = fmt.format(startDate);
  const endLabel = fmt.format(endDate);
  const year = yearFmt.format(endDate);
  return `${startLabel} – ${endLabel}, ${year}`;
}

export function isRitualToday(dateStr: string, timeZone = DEFAULT_TIMEZONE): boolean {
  return dateStr === todayKey(timeZone);
}

export function weekDatesAround(
  anchor: string,
  _timeZone = DEFAULT_TIMEZONE
): { start: string; end: string; days: string[] } {
  const parsed = parseRitualDateOnly(anchor);
  const anchorDate = parsed ?? new Date();
  const day = parsed ? parsed.getDay() : anchorDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  if (parsed) {
    parsed.setDate(parsed.getDate() + diff);
    const start = toRitualDateString(parsed);
    const days = Array.from({ length: 7 }, (_, i) => addDaysToRitualDate(start, i));
    return { start: days[0], end: days[6], days };
  }
  const startDate = new Date(anchorDate);
  startDate.setDate(startDate.getDate() + diff);
  const start = toRitualDateString(startDate);
  const days = Array.from({ length: 7 }, (_, i) => addDaysToRitualDate(start, i));
  return { start: days[0], end: days[6], days };
}

export function eventOnRitualDate(
  eventDate: string,
  eventEnd: string | null | undefined,
  target: string
): boolean {
  if (eventEnd && target > eventDate) {
    return target >= eventDate && target <= eventEnd;
  }
  return eventDate === target;
}

export function timeGreeting(name?: string | null, timeZone = DEFAULT_TIMEZONE): string {
  const hour = zonedParts(new Date(), timeZone).hour;
  const base =
    hour < 12
      ? "good morning"
      : hour < 17
        ? "good afternoon"
        : hour < 21
          ? "good evening"
          : "good night";
  return name ? `${base}, ${name}` : base;
}
