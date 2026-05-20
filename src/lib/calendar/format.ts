import { parseRitualDateOnly } from "@/lib/dates";

export function formatEventTime(
  iso: string | null,
  allDay: boolean,
  timeZone: string
): string {
  if (allDay || !iso || !iso.includes("T")) return "all day";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatShortDate(dateStr: string, timeZone: string): string {
  const d = parseRitualDateOnly(dateStr);
  if (!d) return dateStr;
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function timeBucket(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
