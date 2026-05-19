import { format, startOfWeek, endOfWeek, subDays } from "date-fns";

export function todayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
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
