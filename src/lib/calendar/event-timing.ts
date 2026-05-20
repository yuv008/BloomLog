import { dateInTimeZone, ritualDayBoundsUtc } from "@/lib/dates";
import { DEFAULT_TIMEZONE } from "@/lib/locale/timezones";

const DEFAULT_TIMED_START = "09:00";

function zonedHourMinute(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute };
}

/** Build ISO instant for a ritual date + HH:mm in profile timezone. */
export function buildStartsAtIso(
  ritualDate: string,
  timeHHmm: string,
  timeZone = DEFAULT_TIMEZONE
): string {
  if (timeZone === "UTC" || timeZone === "Etc/UTC") {
    const [h, m] = timeHHmm.split(":");
    return `${ritualDate}T${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}:00.000Z`;
  }
  const [wantHour, wantMinute] = timeHHmm.split(":").map((n) => Number(n));
  const targetMins = (wantHour || 0) * 60 + (wantMinute || 0);
  const { timeMin, timeMax } = ritualDayBoundsUtc(ritualDate, timeZone);
  let t = new Date(timeMin).getTime();
  const hi = new Date(timeMax).getTime() - 60_000;
  let best = t;
  let bestDiff = Infinity;
  while (t <= hi) {
    const d = new Date(t);
    if (dateInTimeZone(d, timeZone) === ritualDate) {
      const { hour, minute } = zonedHourMinute(d, timeZone);
      const diff = Math.abs(hour * 60 + minute - targetMins);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = t;
        if (diff === 0) break;
      }
    }
    t += 60_000;
  }
  return new Date(best).toISOString();
}

/** Extract HH:mm from an ISO timestamp in profile timezone. */
export function parseTimeFromStartsAt(
  iso: string | null | undefined,
  timeZone = DEFAULT_TIMEZONE
): string {
  if (!iso || !iso.includes("T")) return DEFAULT_TIMED_START;
  const { hour, minute } = zonedHourMinute(new Date(iso), timeZone);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export type TimingInput = {
  ritual_date: string;
  all_day?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};

export function normalizeEventTiming(
  input: TimingInput,
  timeZone = DEFAULT_TIMEZONE
): { all_day: boolean; starts_at: string | null; ends_at: string | null } {
  if (input.all_day === true) {
    return { all_day: true, starts_at: null, ends_at: null };
  }
  if (input.all_day === false) {
    const starts =
      input.starts_at ??
      buildStartsAtIso(input.ritual_date, DEFAULT_TIMED_START, timeZone);
    return {
      all_day: false,
      starts_at: starts,
      ends_at: input.ends_at ?? null,
    };
  }
  if (input.starts_at) {
    return {
      all_day: false,
      starts_at: input.starts_at,
      ends_at: input.ends_at ?? null,
    };
  }
  return { all_day: true, starts_at: null, ends_at: null };
}
