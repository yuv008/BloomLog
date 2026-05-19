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
