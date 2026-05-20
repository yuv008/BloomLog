"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCalendarAgenda,
  getCalendarDay,
  getCalendarEventsRange,
  getMonthIndicators,
  getMoodByDateForMonth,
  createCalendarEvent,
  updateCalendarEvent,
  completeCalendarEvent,
  skipCalendarEvent,
  archiveCalendarEvent,
  type CreateCalendarEventInput,
  type UpdateCalendarEventInput,
} from "@/lib/data/calendar-client";
import { localStore } from "@/lib/storage/local";
import { shouldUseSupabase } from "@/lib/data/auth";
import {
  weekDatesAround,
  monthKey,
  monthDateRange,
  isRitualDateKey,
} from "@/lib/dates";
import type { CalendarEvent, WellnessTimelineItem } from "@/lib/types";
import type { Mood } from "@/lib/types";

export function calendarDayKey(userId: string | null, date: string) {
  return ["calendar", userId, date] as const;
}

export function calendarRangeKey(
  userId: string | null,
  from: string,
  to: string
) {
  return ["calendarRange", userId, from, to] as const;
}

async function flushCalendarQueue(userId: string) {
  if (!shouldUseSupabase(userId) || typeof navigator === "undefined" || !navigator.onLine) {
    return;
  }
  const ops = localStore.getPendingCalendarOps();
  for (const item of ops) {
    try {
      if (item.op === "create") {
        await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
      } else if (item.op === "complete" && item.payload.id) {
        await fetch(`/api/calendar/events/${item.payload.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: item.payload.date }),
        });
      } else if (item.op === "update" && item.payload.id) {
        await fetch(`/api/calendar/events/${item.payload.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload.patch),
        });
      } else if (item.op === "delete" && item.payload.id) {
        await fetch(`/api/calendar/events/${item.payload.id}`, {
          method: "DELETE",
        });
      }
    } catch {
      return;
    }
  }
  localStore.flushPendingCalendarOps();
}

export function useCalendarDay(userId: string | null, date: string) {
  return useQuery({
    queryKey: calendarDayKey(userId, date),
    queryFn: async () => {
      if (!userId) return { events: [], wellness: [], mood: null as Mood | null };
      await flushCalendarQueue(userId);
      if (shouldUseSupabase(userId)) {
        const res = await fetch(
          `/api/calendar/day?date=${encodeURIComponent(date)}`
        );
        const json = (await res.json()) as {
          events: CalendarEvent[];
          wellness: WellnessTimelineItem[];
          mood: Mood | null;
        };
        return json;
      }
      const events = await getCalendarDay(userId, date);
      return { events, wellness: [], mood: null };
    },
    enabled: !!userId && isRitualDateKey(date),
    staleTime: 30_000,
  });
}

export function useCalendarRange(
  userId: string | null,
  from: string,
  to: string
) {
  return useQuery({
    queryKey: calendarRangeKey(userId, from, to),
    queryFn: async () => {
      if (!userId) return [];
      await flushCalendarQueue(userId);
      if (shouldUseSupabase(userId)) {
        const res = await fetch(
          `/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );
        const json = (await res.json()) as { events: CalendarEvent[] };
        return json.events ?? [];
      }
      return getCalendarEventsRange(userId, from, to);
    },
    enabled: !!userId && !!from && !!to,
    staleTime: 30_000,
  });
}

export function useCalendarWeek(
  userId: string | null,
  anchor: string,
  timeZone?: string
) {
  const valid = isRitualDateKey(anchor);
  const { days, start, end } = weekDatesAround(anchor, timeZone);
  const q = useCalendarRange(userId, valid ? start : "", valid ? end : "");
  return {
    ...q,
    days: valid ? days : [],
    start: valid ? start : "",
    end: valid ? end : "",
  };
}

export function useCalendarAgenda(userId: string | null, date: string) {
  return useQuery({
    queryKey: ["calendarAgenda", userId, date],
    queryFn: async () => {
      if (!userId) return { items: [], openCount: 0 };
      if (shouldUseSupabase(userId)) {
        const res = await fetch(
          `/api/calendar/agenda?date=${encodeURIComponent(date)}`
        );
        const json = (await res.json()) as {
          items: CalendarEvent[];
          openCount?: number;
        };
        return {
          items: json.items ?? [],
          openCount: json.openCount ?? json.items?.length ?? 0,
        };
      }
      return getCalendarAgenda(userId, date);
    },
    enabled: !!userId && isRitualDateKey(date),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useCalendarMonthIndicators(
  userId: string | null,
  month = monthKey()
) {
  return useQuery({
    queryKey: ["calendarMonth", userId, month],
    queryFn: () => (userId ? getMonthIndicators(userId, month) : {}),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useCalendarMonthMood(userId: string | null, month: string) {
  return useQuery({
    queryKey: ["calendarMonthMood", userId, month],
    queryFn: () => (userId ? getMoodByDateForMonth(userId, month) : {}),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useCreateCalendarEvent(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      if (!userId) throw new Error("not signed in");
      if (shouldUseSupabase(userId) && navigator.onLine) {
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const json = (await res.json()) as { event: CalendarEvent; error?: string };
        if (!res.ok) throw new Error(json.error ?? "create failed");
        return json.event;
      }
      if (!navigator.onLine) {
        localStore.queueCalendarOp("create", input as unknown as Record<string, unknown>);
      }
      return createCalendarEvent(userId, input);
    },
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["calendar", userId] });
      qc.invalidateQueries({ queryKey: ["calendarRange", userId] });
      qc.invalidateQueries({ queryKey: ["calendarAgenda", userId] });
    },
  });
}

export function useCompleteCalendarEvent(userId: string | null, date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("not signed in");
      if (shouldUseSupabase(userId) && navigator.onLine) {
        const res = await fetch(`/api/calendar/events/${id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        });
        const json = (await res.json()) as {
          event: CalendarEvent;
          gardenGranted: boolean;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "complete failed");
        return json;
      }
      if (!navigator.onLine) {
        localStore.queueCalendarOp("complete", { id, date });
      }
      return completeCalendarEvent(userId, id, date);
    },
    onMutate: async (id) => {
      const key = calendarDayKey(userId, date);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old: { events: CalendarEvent[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          events: old.events.map((e) =>
            e.id === id ? { ...e, status: "done" as const } : e
          ),
        };
      });
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(calendarDayKey(userId, date), ctx.prev);
    },
    onSettled: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["calendar", userId] });
      qc.invalidateQueries({ queryKey: ["calendarRange", userId] });
      qc.invalidateQueries({ queryKey: ["calendarAgenda", userId] });
      qc.invalidateQueries({ queryKey: ["garden", userId] });
    },
  });
}

export function useUpdateCalendarEvent(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: UpdateCalendarEventInput;
    }) => {
      if (!userId) throw new Error("not signed in");
      if (shouldUseSupabase(userId) && navigator.onLine) {
        const res = await fetch(`/api/calendar/events/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const json = (await res.json()) as { event: CalendarEvent; error?: string };
        if (!res.ok) throw new Error(json.error ?? "update failed");
        return json.event;
      }
      if (!navigator.onLine) {
        localStore.queueCalendarOp("update", {
          id,
          patch: patch as unknown as Record<string, unknown>,
        });
      }
      return updateCalendarEvent(userId, id, patch);
    },
    onSettled: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["calendar", userId] });
      qc.invalidateQueries({ queryKey: ["calendarRange", userId] });
      qc.invalidateQueries({ queryKey: ["calendarAgenda", userId] });
    },
  });
}

export function useDeleteCalendarEvent(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("not signed in");
      if (shouldUseSupabase(userId) && navigator.onLine) {
        const res = await fetch(`/api/calendar/events/${id}`, {
          method: "DELETE",
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) throw new Error(json.error ?? "delete failed");
        return;
      }
      if (!navigator.onLine) {
        localStore.queueCalendarOp("delete", { id });
      }
      await archiveCalendarEvent(userId, id);
    },
    onSettled: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["calendar", userId] });
      qc.invalidateQueries({ queryKey: ["calendarRange", userId] });
      qc.invalidateQueries({ queryKey: ["calendarAgenda", userId] });
    },
  });
}

export function useCalendarEvent(userId: string | null, id: string | null) {
  return useQuery({
    queryKey: ["calendarEvent", userId, id],
    queryFn: async () => {
      if (!userId || !id) return null;
      if (shouldUseSupabase(userId)) {
        const res = await fetch(`/api/calendar/events/${id}`);
        if (!res.ok) return null;
        const json = (await res.json()) as { event: CalendarEvent };
        return json.event ?? null;
      }
      const { getCalendarEventById } = await import("@/lib/data/calendar-client");
      return getCalendarEventById(userId, id);
    },
    enabled: !!userId && !!id,
    staleTime: 30_000,
  });
}

export function useSkipCalendarEvent(userId: string | null, date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("not signed in");
      if (shouldUseSupabase(userId) && navigator.onLine) {
        const res = await fetch(`/api/calendar/events/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "skipped" }),
        });
        const json = (await res.json()) as { event: CalendarEvent; error?: string };
        if (!res.ok) throw new Error(json.error ?? "skip failed");
        return json.event;
      }
      return skipCalendarEvent(userId, id);
    },
    onSettled: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: calendarDayKey(userId, date) });
      qc.invalidateQueries({ queryKey: ["calendarAgenda", userId] });
    },
  });
}

export function useCalendarMonthRange(
  userId: string | null,
  month: string,
  timeZone?: string
) {
  const { start, end } = monthDateRange(month, timeZone);
  return useCalendarRange(userId, start, end);
}
