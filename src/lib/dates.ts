import { format, startOfWeek, endOfWeek, subDays, endOfMonth } from "date-fns";

export function todayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function monthKey(date = new Date()): string {
  return format(date, "yyyy-MM");
}

export function monthDateRange(month = monthKey()) {
  const [year, monthNum] = month.split("-").map(Number);
  const start = new Date(year, monthNum - 1, 1);
  const end = endOfMonth(start);
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

export function monthLabel(month = monthKey()): string {
  const [year, monthNum] = month.split("-").map(Number);
  return format(new Date(year, monthNum - 1, 1), "MMMM yyyy");
}

export function weekRange(date = new Date()) {
  return {
    start: format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    end: format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}

export function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), 6 - i), "yyyy-MM-dd")
  );
}

export function timeGreeting(name?: string | null): string {
  const hour = new Date().getHours();
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
