"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/posthog";
import * as api from "@/lib/data/api";
import { todayKey, monthKey } from "@/lib/dates";
import { useUserPreferences } from "@/components/providers/user-preferences";

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
