"use client";

import { useEffect, useMemo, useRef } from "react";
import { scheduleCozyHourReminder } from "@/lib/notifications/push";
import {
  addDaysToRitualDate,
  addMonthsToMonthKey,
  firstDayOfMonth,
  formatRitualDayLabel,
  formatWeekRangeLabel,
  isRitualDateKey,
  isRitualToday,
  monthLabel,
  parseRitualDateOnly,
  ritualMonthKeyFromDate,
  shiftWeekByDelta,
  todayKey,
} from "@/lib/dates";
import { useUserPreferences } from "@/components/providers/user-preferences";
import {
  useUserId,
  useDaily,
  useRitualMidnightRefresh,
} from "@/hooks/use-bloom-data";
import {
  useCalendarDay,
  useCalendarWeek,
  useCalendarMonthRange,
  useCalendarMonthIndicators,
  useCalendarMonthMood,
  useCompleteCalendarEvent,
  useCalendarEvent,
} from "@/hooks/use-calendar";
import { useCalendarUiStore } from "@/stores/use-calendar-ui-store";
import { CalendarShell } from "@/components/calendar/calendar-shell";
import { WeekStrip } from "@/components/calendar/week-strip";
import { DayTimeline } from "@/components/calendar/day-timeline";
import { CozyMonthGrid } from "@/components/calendar/cozy-month-grid";
import { EventSheet } from "@/components/calendar/event-sheet";
import { QuickAddFab } from "@/components/calendar/quick-add-fab";
import {
  CalendarPetalLayer,
  useCalendarCompletionBloom,
} from "@/components/calendar/completion-bloom";
import type { CalendarEvent } from "@/lib/types";

export default function CalendarPage() {
  const userId = useUserId();
  const { timezone, ready } = useUserPreferences();
  const view = useCalendarUiStore((s) => s.view);
  const selectedDate = useCalendarUiStore((s) => s.selectedDate);
  const sheetOpen = useCalendarUiStore((s) => s.sheetOpen);
  const editingId = useCalendarUiStore((s) => s.editingId);
  const editingEvent = useCalendarUiStore((s) => s.editingEvent);
  const setView = useCalendarUiStore((s) => s.setView);
  const setSelectedDate = useCalendarUiStore((s) => s.setSelectedDate);
  const openSheet = useCalendarUiStore((s) => s.openSheet);
  const closeSheet = useCalendarUiStore((s) => s.closeSheet);

  const tzSynced = useRef(false);
  const prevTimezone = useRef(timezone);

  useRitualMidnightRefresh(userId);

  useEffect(() => {
    void scheduleCozyHourReminder("20:00", timezone);
  }, [timezone]);

  const ritualToday = todayKey(timezone);
  const effectiveDate = useMemo(() => {
    if (isRitualDateKey(selectedDate)) return selectedDate;
    if (ready) return ritualToday;
    return null;
  }, [selectedDate, ready, ritualToday]);

  useEffect(() => {
    if (!ready) return;
    const today = todayKey(timezone);
    if (!tzSynced.current) {
      if (!isRitualDateKey(selectedDate)) setSelectedDate(today);
      tzSynced.current = true;
      prevTimezone.current = timezone;
      return;
    }
    if (prevTimezone.current !== timezone) {
      setSelectedDate(today);
      prevTimezone.current = timezone;
    }
  }, [ready, timezone, setSelectedDate, selectedDate]);

  const { data: daily } = useDaily(userId);
  const mood = daily?.mood ?? null;

  const dateForQueries = effectiveDate ?? "";
  const month = ritualMonthKeyFromDate(dateForQueries, timezone);

  const { data: dayBundle } = useCalendarDay(userId, dateForQueries);
  const week = useCalendarWeek(userId, dateForQueries, timezone);
  const monthRange = useCalendarMonthRange(userId, month, timezone);
  const { data: indicators } = useCalendarMonthIndicators(userId, month);
  const { data: moodByDate } = useCalendarMonthMood(userId, month);

  const complete = useCompleteCalendarEvent(userId, dateForQueries);
  const bloom = useCalendarCompletionBloom();

  const needsFetch = !!editingId && !editingEvent;
  const { data: fetchedEvent, isLoading: fetchEventLoading } = useCalendarEvent(
    userId,
    needsFetch ? editingId : null
  );

  const editing = useMemo(() => {
    if (!editingId) return null;
    if (editingEvent?.id === editingId) return editingEvent;
    return (
      dayBundle?.events.find((e) => e.id === editingId) ??
      week.data?.find((e) => e.id === editingId) ??
      monthRange.data?.find((e) => e.id === editingId) ??
      fetchedEvent ??
      null
    );
  }, [
    editingId,
    editingEvent,
    dayBundle,
    week.data,
    monthRange.data,
    fetchedEvent,
  ]);

  const editingLoading = needsFetch && fetchEventLoading;

  const headerLabel = useMemo(() => {
    if (!effectiveDate) return "…";
    if (view === "month") return monthLabel(month, timezone);
    if (view === "week" && week.start && week.end) {
      return formatWeekRangeLabel(week.start, week.end, timezone);
    }
    const parsed = parseRitualDateOnly(effectiveDate);
    return formatRitualDayLabel(parsed ?? new Date(), timezone);
  }, [view, month, timezone, week.start, week.end, effectiveDate]);

  const showToday = useMemo(() => {
    if (!effectiveDate) return false;
    if (view === "month") {
      const sameMonth =
        ritualMonthKeyFromDate(effectiveDate, timezone) ===
        ritualMonthKeyFromDate(ritualToday, timezone);
      return !sameMonth || !isRitualToday(effectiveDate, timezone);
    }
    if (view === "week" && week.days?.length) {
      return (
        !week.days.includes(ritualToday) ||
        !isRitualToday(effectiveDate, timezone)
      );
    }
    return !isRitualToday(effectiveDate, timezone);
  }, [view, effectiveDate, ritualToday, timezone, week.days]);

  function navAnchor(): string {
    return isRitualDateKey(selectedDate) ? selectedDate : ritualToday;
  }

  function nav(delta: number) {
    const anchor = navAnchor();
    if (view === "month") {
      const nextMonth = addMonthsToMonthKey(month, delta);
      setSelectedDate(firstDayOfMonth(nextMonth));
    } else if (view === "week") {
      setSelectedDate(shiftWeekByDelta(anchor, delta));
    } else {
      setSelectedDate(addDaysToRitualDate(anchor, delta));
    }
  }

  function goToday() {
    setSelectedDate(ritualToday);
  }

  async function onComplete(id: string) {
    const result = await complete.mutateAsync(id);
    bloom();
    if (result.gardenGranted) bloom();
  }

  function onEventTap(e: CalendarEvent) {
    openSheet(e);
  }

  if (!userId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-whisper">
        waking up your rhythm…
      </div>
    );
  }

  if (!effectiveDate) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-whisper">
        waking up your rhythm…
      </div>
    );
  }

  return (
    <>
      <CalendarPetalLayer />
      <CalendarShell
        selectedDate={effectiveDate}
        timeZone={timezone}
        mood={mood}
        view={view}
        headerLabel={headerLabel}
        showToday={showToday}
        onToday={goToday}
        onViewChange={setView}
        onPrev={() => nav(-1)}
        onNext={() => nav(1)}
        weekEvents={week.data ?? []}
      >
        {view === "week" && week.days && (
          <>
            <WeekStrip
              days={week.days}
              selected={effectiveDate}
              events={week.data ?? []}
              timeZone={timezone}
              onSelect={setSelectedDate}
            />
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <DayTimeline
                events={dayBundle?.events ?? []}
                wellness={dayBundle?.wellness}
                timeZone={timezone}
                onEventTap={onEventTap}
                onComplete={onComplete}
              />
            </div>
          </>
        )}

        {view === "day" && (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <DayTimeline
              events={dayBundle?.events ?? []}
              wellness={dayBundle?.wellness}
              timeZone={timezone}
              onEventTap={onEventTap}
              onComplete={onComplete}
            />
          </div>
        )}

        {view === "month" && (
          <CozyMonthGrid
            month={month}
            selected={effectiveDate}
            events={monthRange.data ?? []}
            indicators={indicators}
            moodByDate={moodByDate}
            timeZone={timezone}
            onSelect={(d) => {
              setSelectedDate(d);
              setView("day");
            }}
          />
        )}
      </CalendarShell>

      <QuickAddFab onClick={() => openSheet(null)} />
      <EventSheet
        open={sheetOpen}
        onClose={closeSheet}
        userId={userId}
        ritualDate={effectiveDate}
        editing={editing}
        editingLoading={editingLoading}
      />
    </>
  );
}
