import { describe, it, expect } from "vitest";
import {
  parseRitualDateOnly,
  addDaysToRitualDate,
  addMonthsToMonthKey,
  firstDayOfMonth,
  ritualMonthKeyFromDate,
  isRitualDateKey,
  shiftWeekByDelta,
  weekStartFromAnchor,
  toRitualDateString,
  eventOnRitualDate,
  weekDatesAround,
  ritualDayBoundsUtc,
  dateInTimeZone,
} from "@/lib/dates";
import { expandRecurrenceInstances } from "@/lib/calendar/expand-recurrence";
import {
  eventOverlapsRange,
  eventVisibleOnDay,
  filterEventsForRange,
} from "@/lib/data/calendar-event-query";
import { buildWellnessTimeline } from "@/lib/calendar/merge-wellness";
import { formatEventTime } from "@/lib/calendar/format";
import {
  buildStartsAtIso,
  parseTimeFromStartsAt,
  normalizeEventTiming,
} from "@/lib/calendar/event-timing";
import type { CalendarEvent, RecurrenceRule } from "@/lib/types";

function mockRule(partial: Partial<RecurrenceRule>): RecurrenceRule {
  return {
    id: "rule-1",
    user_id: "user-1",
    frequency: "daily",
    interval_count: 1,
    by_weekday: [],
    starts_on: "2025-06-01",
    ends_on: null,
    template: { title: "stretch", category: "ritual" },
    last_generated_through: null,
    created_at: "2025-06-01T00:00:00Z",
    ...partial,
  };
}

describe("parseRitualDateOnly", () => {
  it("rejects invalid calendar dates", () => {
    expect(parseRitualDateOnly("2025-02-30")).toBeNull();
    expect(parseRitualDateOnly("not-a-date")).toBeNull();
    expect(parseRitualDateOnly("")).toBeNull();
  });

  it("parses valid dates without UTC shift", () => {
    const d = parseRitualDateOnly("2025-12-31")!;
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
});

describe("addDaysToRitualDate", () => {
  it("crosses month and year boundaries", () => {
    expect(addDaysToRitualDate("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDaysToRitualDate("2025-01-01", -1)).toBe("2024-12-31");
  });

  it("returns original string when input invalid", () => {
    expect(addDaysToRitualDate("bad", 3)).toBe("bad");
  });
});

describe("eventOnRitualDate / range overlap", () => {
  const multiDay = {
    ritual_date: "2025-06-10",
    ritual_end_date: "2025-06-12",
  } as CalendarEvent;

  it("includes middle days of multi-day span", () => {
    expect(eventOnRitualDate(multiDay.ritual_date, multiDay.ritual_end_date, "2025-06-11")).toBe(
      true
    );
    expect(eventVisibleOnDay(multiDay, "2025-06-11")).toBe(true);
    expect(eventVisibleOnDay(multiDay, "2025-06-09")).toBe(false);
  });

  it("range query includes span starting before window", () => {
    expect(eventOverlapsRange(multiDay, "2025-06-11", "2025-06-15")).toBe(true);
    expect(eventOverlapsRange(multiDay, "2025-06-13", "2025-06-15")).toBe(false);
    const events = filterEventsForRange(
      [{ ...multiDay, id: "1" } as CalendarEvent],
      "2025-06-11",
      "2025-06-12"
    );
    expect(events).toHaveLength(1);
  });
});

describe("isRitualDateKey", () => {
  it("accepts canonical YYYY-MM-DD keys", () => {
    expect(isRitualDateKey("2026-05-20")).toBe(true);
  });

  it("rejects empty and malformed strings", () => {
    expect(isRitualDateKey("")).toBe(false);
    expect(isRitualDateKey("2026-5-20")).toBe(false);
    expect(isRitualDateKey("not-a-date")).toBe(false);
  });
});

describe("ritualMonthKeyFromDate", () => {
  it("extracts YYYY-MM without drift", () => {
    expect(ritualMonthKeyFromDate("2026-05-20")).toBe("2026-05");
  });

  it("falls back to profile month when date invalid", () => {
    const tz = "Pacific/Auckland";
    const expected = dateInTimeZone(new Date(), tz).slice(0, 7);
    expect(ritualMonthKeyFromDate("", tz)).toBe(expected);
  });
});

describe("addMonthsToMonthKey", () => {
  it("advances May to June", () => {
    expect(addMonthsToMonthKey("2025-05", 1)).toBe("2025-06");
  });

  it("rolls December to January next year", () => {
    expect(addMonthsToMonthKey("2025-12", 1)).toBe("2026-01");
  });
});

describe("shiftWeekByDelta", () => {
  it("moves Wednesday anchor to next Monday-start week", () => {
    const next = shiftWeekByDelta("2025-06-11", 1);
    expect(weekStartFromAnchor(next)).toBe(next);
    expect(next).toBe("2025-06-16");
  });
});

describe("firstDayOfMonth", () => {
  it("returns first of month", () => {
    expect(firstDayOfMonth("2026-07")).toBe("2026-07-01");
  });
});

describe("event-timing", () => {
  it("buildStartsAtIso and parseTimeFromStartsAt round-trip in UTC", () => {
    const iso = buildStartsAtIso("2026-06-15", "14:30", "UTC");
    expect(parseTimeFromStartsAt(iso, "UTC")).toBe("14:30");
  });

  it("normalizeEventTiming clears times when all-day", () => {
    expect(
      normalizeEventTiming({
        ritual_date: "2026-06-15",
        all_day: true,
        starts_at: "2026-06-15T10:00:00Z",
      }).all_day
    ).toBe(true);
    expect(
      normalizeEventTiming({
        ritual_date: "2026-06-15",
        all_day: true,
        starts_at: "2026-06-15T10:00:00Z",
      }).starts_at
    ).toBeNull();
  });

  it("normalizeEventTiming defaults morning when timed without starts_at", () => {
    const t = normalizeEventTiming(
      { ritual_date: "2026-06-15", all_day: false },
      "UTC"
    );
    expect(t.all_day).toBe(false);
    expect(t.starts_at).toBeTruthy();
    expect(parseTimeFromStartsAt(t.starts_at, "UTC")).toBe("09:00");
  });
});

describe("weekDatesAround", () => {
  it("returns 7 consecutive ritual days", () => {
    const { days, start, end } = weekDatesAround("2025-06-11", "UTC");
    expect(days).toHaveLength(7);
    expect(start).toBe(days[0]);
    expect(end).toBe(days[6]);
    expect(days[0]).toBe("2025-06-09");
    expect(days[6]).toBe("2025-06-15");
  });

  it("Monday-start week for Wednesday anchor", () => {
    const { days } = weekDatesAround("2025-06-11", "America/New_York");
    expect(days[0]).toMatch(/2025-06-09/);
  });
});

describe("ritualDayBoundsUtc", () => {
  it("bounds cover entire ritual day in Tokyo", () => {
    const { timeMin, timeMax } = ritualDayBoundsUtc("2025-06-15", "Asia/Tokyo");
    expect(dateInTimeZone(new Date(timeMin), "Asia/Tokyo")).toBe("2025-06-15");
    expect(new Date(timeMax).getTime()).toBeGreaterThan(new Date(timeMin).getTime());
  });
});

describe("expandRecurrenceInstances", () => {
  it("daily generates through date inclusive", () => {
    const rule = mockRule({ frequency: "daily", starts_on: "2025-06-01" });
    const instances = expandRecurrenceInstances(rule, "2025-06-05", "user-1");
    expect(instances.map((i) => i.ritual_date)).toEqual([
      "2025-06-01",
      "2025-06-02",
      "2025-06-03",
      "2025-06-04",
      "2025-06-05",
    ]);
  });

  it("respects ends_on", () => {
    const rule = mockRule({
      frequency: "daily",
      starts_on: "2025-06-01",
      ends_on: "2025-06-03",
    });
    const instances = expandRecurrenceInstances(rule, "2025-06-10", "user-1");
    expect(instances).toHaveLength(3);
  });

  it("weekly hits Mon/Wed only", () => {
    const rule = mockRule({
      frequency: "weekly",
      starts_on: "2025-06-02",
      by_weekday: [1, 3],
    });
    const instances = expandRecurrenceInstances(rule, "2025-06-15", "user-1");
    const dates = instances.map((i) => i.ritual_date);
    for (const d of dates) {
      const dow = new Date(d + "T12:00:00").getDay();
      expect([1, 3]).toContain(dow);
    }
    expect(dates).toContain("2025-06-02");
    expect(dates).toContain("2025-06-04");
  });

  it("caps at MAX_INSTANCES", () => {
    const rule = mockRule({ frequency: "daily", starts_on: "2025-01-01" });
    const instances = expandRecurrenceInstances(rule, "2026-12-31", "user-1");
    expect(instances.length).toBeLessThanOrEqual(52);
  });
});

describe("buildWellnessTimeline", () => {
  it("empty inputs yield empty timeline", () => {
    expect(buildWellnessTimeline(null, [], "UTC")).toEqual([]);
  });

  it("water goal only when met", () => {
    const items = buildWellnessTimeline(
      { water_ml: 1500 } as never,
      [],
      "UTC",
      2000
    );
    expect(items.find((i) => i.id === "water-goal")).toBeUndefined();
    const met = buildWellnessTimeline(
      { water_ml: 2000 } as never,
      [],
      "UTC",
      2000
    );
    expect(met.find((i) => i.id === "water-goal")).toBeDefined();
  });
});

describe("formatEventTime", () => {
  it("all-day and invalid return all day", () => {
    expect(formatEventTime(null, true, "UTC")).toBe("all day");
    expect(formatEventTime("2025-06-01", false, "UTC")).toBe("all day");
  });
});

describe("create validation (client)", () => {
  it("rejects whitespace-only title", async () => {
    const { createCalendarEvent } = await import("@/lib/data/calendar-client");
    await expect(
      createCalendarEvent("guest_test", {
        ritual_date: "2025-06-01",
        title: "   ",
      })
    ).rejects.toThrow("title required");
  });
});

describe("toRitualDateString roundtrip", () => {
  it("roundtrips local date", () => {
    const d = parseRitualDateOnly("2025-03-15")!;
    expect(toRitualDateString(d)).toBe("2025-03-15");
  });
});
