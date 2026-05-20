"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/posthog";
import * as api from "@/lib/data/api";
import type { AddFoodLogInput } from "@/lib/data/food-log";
import { shouldUseSupabase } from "@/lib/data/auth";
import { compressMealPhoto, revokeMealPreview } from "@/lib/media/compress-image";
import { todayKey, monthKey, msUntilMidnightInTz } from "@/lib/dates";
import { useUserPreferences } from "@/components/providers/user-preferences";
import type { FoodLogEntry } from "@/lib/types";

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    api.ensureAuth().then((session) => setUserId(session.userId));
  }, []);
  return userId;
}

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => (userId ? api.getProfile(userId) : null),
    enabled: !!userId,
  });
}

function useRitualDateKeys() {
  const { timezone } = useUserPreferences();
  const date = todayKey(timezone);
  const month = monthKey(new Date(), timezone);
  return { timezone, date, month };
}

export function useDaily(userId: string | null) {
  const { date } = useRitualDateKeys();
  return useQuery({
    queryKey: ["daily", userId, date],
    queryFn: () => (userId ? api.getDailyEntry(userId, date) : null),
    enabled: !!userId,
    /** Keep Today→Garden in sync when mood/water is patched without waiting on a refetch. */
    staleTime: 60_000,
  });
}

export function useExpenses(userId: string | null) {
  const { date } = useRitualDateKeys();
  return useQuery({
    queryKey: ["expenses", userId, date],
    queryFn: () => (userId ? api.getExpenses(userId, date) : []),
    enabled: !!userId,
  });
}

export function useMonthlyExpenses(userId: string | null) {
  const { month } = useRitualDateKeys();
  return useQuery({
    queryKey: ["expenses-month", userId, month],
    queryFn: () => (userId ? api.getExpensesForMonth(userId, month) : []),
    enabled: !!userId,
  });
}

export function useMeals(userId: string | null) {
  const { date } = useRitualDateKeys();
  return useQuery({
    queryKey: ["meals", userId, date],
    queryFn: () => (userId ? api.getMeals(userId, date) : []),
    enabled: !!userId,
  });
}

export function useFoodLog(userId: string | null) {
  const { date } = useRitualDateKeys();
  return useQuery({
    queryKey: ["foodLog", userId, date],
    queryFn: () => (userId ? api.getFoodLog(userId, date) : []),
    enabled: !!userId,
  });
}

export type AddFoodLogMutationInput = AddFoodLogInput & { photoFile?: File | null };

export function useAddFoodLog(userId: string | null) {
  const qc = useQueryClient();
  const { date } = useRitualDateKeys();
  const invalidateNourish = useInvalidateNourish();

  return useMutation({
    mutationFn: async (input: AddFoodLogMutationInput) => {
      if (!userId) throw new Error("not signed in");
      const { photoFile, ...rest } = input;
      const ritualDate = rest.date ?? date;

      if (photoFile && shouldUseSupabase(userId)) {
        const compressed = await compressMealPhoto(photoFile);
        try {
          const fd = new FormData();
          fd.append("thumb", compressed.thumbBlob, "thumb.webp");
          fd.append("full", compressed.fullBlob, "full.webp");
          fd.append("meal_slot", rest.meal_slot);
          fd.append("name", rest.name);
          fd.append("date", ritualDate);
          fd.append("source", rest.source ?? "polaroid");
          fd.append("emotional_tags", JSON.stringify(rest.emotional_tags ?? []));
          const res = await fetch("/api/upload/meal-photo", { method: "POST", body: fd });
          if (!res.ok) {
            const err = (await res.json()) as { error?: string };
            throw new Error(err.error ?? "photo upload failed");
          }
          const data = (await res.json()) as { entry: FoodLogEntry };
          return data.entry;
        } finally {
          revokeMealPreview(compressed.previewUrl);
        }
      }

      if (photoFile) {
        const compressed = await compressMealPhoto(photoFile);
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(compressed.thumbBlob);
          });
          return api.addFoodLog(userId, {
            ...rest,
            date: ritualDate,
            photo_url: dataUrl,
            source_meta: {
              ...rest.source_meta,
              photo_bytes: compressed.thumbBytes + compressed.fullBytes,
            },
          });
        } finally {
          revokeMealPreview(compressed.previewUrl);
        }
      }

      return api.addFoodLog(userId, { ...rest, date: ritualDate });
    },
    onMutate: async (input) => {
      if (!userId || !input.photoFile) return { prev: undefined as FoodLogEntry[] | undefined };
      await qc.cancelQueries({ queryKey: ["foodLog", userId, date] });
      const prev = qc.getQueryData<FoodLogEntry[]>(["foodLog", userId, date]);
      const preview = URL.createObjectURL(input.photoFile);
      const temp: FoodLogEntry = {
        id: `temp-${Date.now()}`,
        user_id: userId,
        date,
        logged_at: new Date().toISOString(),
        meal_slot: input.meal_slot,
        name: input.name,
        photo_url: preview,
        emotional_tags: input.emotional_tags ?? [],
        calories: input.calories ?? null,
        protein_g: input.protein_g ?? null,
        carbs_g: input.carbs_g ?? null,
        fat_g: input.fat_g ?? null,
        fiber_g: null,
        journal_note: input.journal_note ?? null,
        source: input.source ?? "polaroid",
        source_meta: { uploading: true },
        created_at: new Date().toISOString(),
      };
      qc.setQueryData(["foodLog", userId, date], [...(prev ?? []), temp]);
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (userId && ctx?.prev) {
        qc.setQueryData(["foodLog", userId, date], ctx.prev);
      }
    },
    onSuccess: (entry) => {
      if (!userId) return;
      qc.setQueryData<FoodLogEntry[]>(["foodLog", userId, date], (old) => {
        const list = old ?? [];
        const withoutTemp = list.filter((e) => !String(e.id).startsWith("temp-"));
        const exists = withoutTemp.some((e) => e.id === entry.id);
        return exists ? withoutTemp : [...withoutTemp, entry];
      });
      invalidateNourish(userId);
      qc.invalidateQueries({ queryKey: ["mealPolaroids", userId] });
    },
  });
}

export function useNutritionSummary(userId: string | null) {
  const { date } = useRitualDateKeys();
  return useQuery({
    queryKey: ["nourish", "summary", userId, date],
    queryFn: () => (userId ? api.getDailyNutritionSummary(userId, date) : null),
    enabled: !!userId,
  });
}

export function useFoodFavorites(userId: string | null) {
  return useQuery({
    queryKey: ["foodFavorites", userId],
    queryFn: () => (userId ? api.getFoodFavorites(userId) : []),
    enabled: !!userId,
  });
}

export function useAiRecipes(userId: string | null) {
  return useQuery({
    queryKey: ["aiRecipes", userId],
    queryFn: () => (userId ? api.getAiRecipes(userId) : []),
    enabled: !!userId,
  });
}

export function useHydrationStreak(userId: string | null) {
  return useQuery({
    queryKey: ["hydrationStreak", userId],
    queryFn: () => (userId ? api.getHydrationStreak(userId) : 0),
    enabled: !!userId,
  });
}

export function useInvalidateNourish() {
  const qc = useQueryClient();
  const { date } = useRitualDateKeys();
  return (userId: string) => {
    qc.invalidateQueries({ queryKey: ["foodLog", userId, date] });
    qc.invalidateQueries({ queryKey: ["nourish", "summary", userId, date] });
    qc.invalidateQueries({ queryKey: ["meals", userId, date] });
    qc.invalidateQueries({ queryKey: ["foodFavorites", userId] });
    qc.invalidateQueries({ queryKey: ["aiRecipes", userId] });
    qc.invalidateQueries({ queryKey: ["hydrationStreak", userId] });
    qc.invalidateQueries({ queryKey: ["mealPolaroids", userId] });
  };
}

export function useQuests(userId: string | null) {
  const { date } = useRitualDateKeys();
  return useQuery({
    queryKey: ["quests", userId, date],
    queryFn: () => (userId ? api.getQuestCompletions(userId, date) : []),
    enabled: !!userId,
  });
}

/** Refresh quest completions after daily / food / journal data is available. */
export function useSyncQuestsOnDaily(userId: string | null) {
  const qc = useQueryClient();
  const { date } = useRitualDateKeys();
  const { data: daily, isSuccess: dailyReady } = useDaily(userId);
  const { data: foodLog, isSuccess: foodReady } = useFoodLog(userId);
  const { data: letters, isSuccess: journalReady } = useJournalLetters(userId);

  useEffect(() => {
    if (!userId || !dailyReady || !foodReady || !journalReady) return;
    void api.syncAutoQuests(userId, date).then(() => {
      qc.invalidateQueries({ queryKey: ["quests", userId, date] });
    });
  }, [
    userId,
    date,
    dailyReady,
    foodReady,
    journalReady,
    daily?.water_ml,
    daily?.sleep_end,
    daily?.mood,
    foodLog?.length,
    letters?.length,
    qc,
  ]);
}

export function useGarden(userId: string | null) {
  return useQuery({
    queryKey: ["garden", userId],
    queryFn: () => (userId ? api.getGardenItems(userId) : []),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });
}

export function usePolaroids(userId: string | null) {
  return useQuery({
    queryKey: ["polaroids", userId],
    queryFn: () => (userId ? api.getPolaroids(userId) : []),
    enabled: !!userId,
  });
}

export function useMealPolaroids(userId: string | null) {
  return useQuery({
    queryKey: ["mealPolaroids", userId],
    queryFn: () => (userId ? api.getMealPolaroids(userId) : []),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useJournalLetters(userId: string | null) {
  return useQuery({
    queryKey: ["journal", userId],
    queryFn: () => (userId ? api.getJournalLetters(userId) : []),
    enabled: !!userId,
  });
}

export function useTodayKey() {
  const { date, month, timezone } = useRitualDateKeys();
  return { date, month, timezone };
}

export function useInvalidateDaily() {
  const qc = useQueryClient();
  const { date } = useRitualDateKeys();
  return (userId: string) => {
    qc.invalidateQueries({ queryKey: ["daily", userId, date] });
    qc.invalidateQueries({ queryKey: ["garden", userId] });
  };
}

export function useInvalidateRitualQueries() {
  const qc = useQueryClient();
  return (userId: string) => {
    qc.invalidateQueries({ queryKey: ["daily", userId] });
    qc.invalidateQueries({ queryKey: ["expenses", userId] });
    qc.invalidateQueries({ queryKey: ["expenses-month", userId] });
    qc.invalidateQueries({ queryKey: ["meals", userId] });
    qc.invalidateQueries({ queryKey: ["foodLog", userId] });
    qc.invalidateQueries({ queryKey: ["nourish", "summary", userId] });
    qc.invalidateQueries({ queryKey: ["hydrationStreak", userId] });
    qc.invalidateQueries({ queryKey: ["quests", userId] });
    qc.invalidateQueries({ queryKey: ["journal", userId] });
    qc.invalidateQueries({ queryKey: ["calendarAgenda", userId] });
    qc.invalidateQueries({ queryKey: ["calendar", userId] });
    qc.invalidateQueries({ queryKey: ["calendarRange", userId] });
  };
}

export function usePatchDailyCache() {
  const qc = useQueryClient();
  const { date } = useRitualDateKeys();
  return (userId: string, entry: Awaited<ReturnType<typeof api.getDailyEntry>>) => {
    qc.setQueryData(["daily", userId, date], entry);
  };
}

export function usePatchProfileCache() {
  const qc = useQueryClient();
  return (userId: string, profile: Awaited<ReturnType<typeof api.getProfile>>) => {
    qc.setQueryData(["profile", userId], profile);
  };
}

/** Invalidate ritual queries when the profile-timezone day rolls over */
export function useRitualMidnightRefresh(userId: string | null) {
  const qc = useQueryClient();
  const { timezone } = useUserPreferences();

  useEffect(() => {
    if (!userId) return;
    const schedule = () => {
      const ms = msUntilMidnightInTz(timezone);
      return window.setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["daily", userId] });
        qc.invalidateQueries({ queryKey: ["expenses", userId] });
        qc.invalidateQueries({ queryKey: ["foodLog", userId] });
        qc.invalidateQueries({ queryKey: ["quests", userId] });
        qc.invalidateQueries({ queryKey: ["nourish", "summary", userId] });
        qc.invalidateQueries({ queryKey: ["calendar", userId] });
        qc.invalidateQueries({ queryKey: ["calendarRange", userId] });
        qc.invalidateQueries({ queryKey: ["calendarAgenda", userId] });
        qc.invalidateQueries({ queryKey: ["calendarMonth", userId] });
        schedule();
      }, ms);
    };
    const id = schedule();
    return () => clearTimeout(id);
  }, [userId, timezone, qc]);
}

export function useAddWater(userId: string | null) {
  const qc = useQueryClient();
  const { date } = useRitualDateKeys();
  const patchDaily = usePatchDailyCache();
  const invalidateDaily = useInvalidateDaily();
  const invalidateNourish = useInvalidateNourish();

  return useCallback(
    async (ml: number, source: "today" | "nourish" = "today") => {
      if (!userId) return null;
      const entry = await api.addWater(userId, ml, date);
      patchDaily(userId, entry);
      invalidateDaily(userId);
      invalidateNourish(userId);
      qc.invalidateQueries({ queryKey: ["quests", userId, date] });
      trackEvent("water_added", { ml, source });
      return entry;
    },
    [userId, date, patchDaily, invalidateDaily, invalidateNourish, qc]
  );
}
