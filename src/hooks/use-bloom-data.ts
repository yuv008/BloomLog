"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

export function useQuests(userId: string | null) {
  const { date } = useRitualDateKeys();
  return useQuery({
    queryKey: ["quests", userId, date],
    queryFn: () => (userId ? api.getQuestCompletions(userId, date) : []),
    enabled: !!userId,
  });
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
