"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { localStore, getOrCreateGuestId } from "@/lib/storage/local";
import { todayKey, monthKey, monthDateRange } from "@/lib/dates";
import { detectDefaultLocale } from "@/lib/locale/detect";
import { normalizeCurrency } from "@/lib/locale/currencies";
import { normalizeTimezone } from "@/lib/locale/timezones";
import { ensureAuth, shouldUseSupabase, isLocalUserId } from "@/lib/data/auth";
import type {
  DailyEntry,
  Expense,
  GardenItem,
  Meal,
  MemoryPolaroid,
  QuestCompletion,
  UserProfile,
  WhisperLog,
  JournalLetter,
  Mood,
  ExpenseCategory,
  FoodTag,
  RoomTheme,
  SleepQuality,
} from "@/lib/types";
import { pickDailyQuests, isRareSeedRoll } from "@/lib/quests/pool";
import { randomGardenReward } from "@/lib/garden/items";

function uid() {
  return crypto.randomUUID();
}

async function todayForUser(userId: string, date?: string): Promise<string> {
  if (date) return date;
  const profile = await getProfile(userId);
  return todayKey(profile?.timezone);
}

async function monthForUser(userId: string, month?: string): Promise<string> {
  if (month) return month;
  const profile = await getProfile(userId);
  return monthKey(new Date(), profile?.timezone);
}

export { ensureAuth, shouldUseSupabase, isLocalUserId };

export async function ensureAuthUserId(): Promise<string> {
  const session = await ensureAuth();
  return session.userId;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("users_profile")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data) return normalizeProfile(data as UserProfile);
  }
  const local = localStore.getProfile();
  if (!local) return null;
  if (local.id === userId || isLocalUserId(userId)) return normalizeProfile(local);
  if (local.onboarding_complete) return normalizeProfile({ ...local, id: userId });
  return null;
}

function normalizeProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    currency: normalizeCurrency(profile.currency),
    timezone: normalizeTimezone(profile.timezone),
  };
}

export async function upsertProfile(
  userId: string,
  patch: Partial<UserProfile>
): Promise<UserProfile> {
  const defaults = detectDefaultLocale();
  const existing = (await getProfile(userId)) ?? {
    id: userId,
    display_name: null,
    cozy_hour: "21:00",
    room_theme: "windowsill" as RoomTheme,
    onboarding_complete: false,
    notifications_enabled: false,
    finance_enabled: true,
    currency: defaults.currency,
    timezone: defaults.timezone,
    created_at: new Date().toISOString(),
  };
  const merged = normalizeProfile({ ...existing, ...patch, id: userId });

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("users_profile").upsert(merged);
    if (error) console.warn("[bloomlog] profile upsert:", error.message);
    else return merged;
  }

  localStore.setProfile(merged);
  return merged;
}

export async function getDailyEntry(
  userId: string,
  date = todayKey()
): Promise<DailyEntry | null> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();
    if (!error && data) return data as DailyEntry;
  }
  const local = localStore.getDaily(date);
  if (!local) return null;
  if (local.user_id === userId || isLocalUserId(userId)) return local;
  if (isLocalUserId(local.user_id)) {
    return { ...local, user_id: userId };
  }
  return null;
}

export async function upsertDailyEntry(
  userId: string,
  patch: Partial<DailyEntry> & { date?: string }
): Promise<DailyEntry> {
  const date = patch.date ?? (await todayForUser(userId));
  const existing = (await getDailyEntry(userId, date)) ?? {
    id: uid(),
    user_id: userId,
    date,
    mood: null,
    note: null,
    sleep_start: null,
    sleep_end: null,
    sleep_quality: null,
    water_ml: 0,
    created_at: new Date().toISOString(),
  };
  const merged = { ...existing, ...patch, user_id: userId, date };

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("daily_entries").upsert(merged);
    if (!error) return merged;
    console.warn("[bloomlog] daily upsert:", error.message);
  }

  localStore.setDaily(merged);
  return merged;
}

export async function setMood(userId: string, mood: Mood, date?: string) {
  const d = await todayForUser(userId, date);
  return upsertDailyEntry(userId, { mood, date: d });
}

export async function addWater(userId: string, ml: number, date?: string) {
  const d = await todayForUser(userId, date);
  const entry = await getDailyEntry(userId, d);
  const water_ml = (entry?.water_ml ?? 0) + ml;
  return upsertDailyEntry(userId, { water_ml, date: d });
}

export async function setNote(userId: string, note: string) {
  return upsertDailyEntry(userId, { note: note || null });
}

export async function setSleep(
  userId: string,
  sleep_start: string,
  sleep_end: string,
  sleep_quality: SleepQuality | null,
  date?: string
) {
  const d = await todayForUser(userId, date);
  return upsertDailyEntry(userId, { sleep_start, sleep_end, sleep_quality, date: d });
}

export async function getExpenses(
  userId: string,
  date = todayKey()
): Promise<Expense[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: true });
    if (!error && data) return data as Expense[];
  }
  return localStore.getExpenses(date);
}

export async function getExpensesForMonth(
  userId: string,
  month?: string
): Promise<Expense[]> {
  const resolvedMonth = month ?? (await monthForUser(userId));
  const profile = await getProfile(userId);
  const { start, end } = monthDateRange(resolvedMonth, profile?.timezone);
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });
    if (!error && data) return data as Expense[];
  }
  const local = localStore.getExpensesForMonth(resolvedMonth);
  if (isLocalUserId(userId)) return local;
  return local.filter((e) => e.user_id === userId);
}

export async function addExpense(
  userId: string,
  category: ExpenseCategory,
  amount: number,
  note?: string,
  date?: string
) {
  const expense: Expense = {
    id: uid(),
    user_id: userId,
    date: await todayForUser(userId, date),
    category,
    amount,
    note: note ?? null,
    created_at: new Date().toISOString(),
  };

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("expenses").insert(expense);
    if (!error) return expense;
    console.warn("[bloomlog] expense insert:", error.message);
  }

  localStore.addExpense(expense);
  return expense;
}

export async function getMeals(userId: string, date = todayKey()): Promise<Meal[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("meal_time", { ascending: true });
    if (!error && data) return data as Meal[];
  }
  return localStore.getMeals(date);
}

export async function addMeal(
  userId: string,
  tags: FoodTag[],
  photo_url?: string | null,
  date?: string
) {
  const meal: Meal = {
    id: uid(),
    user_id: userId,
    date: await todayForUser(userId, date),
    meal_time: new Date().toISOString(),
    photo_url: photo_url ?? null,
    tags,
  };

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("meals").insert(meal);
    if (!error) return meal;
    console.warn("[bloomlog] meal insert:", error.message);
  }

  localStore.addMeal(meal);
  return meal;
}

export async function getQuestCompletions(
  userId: string,
  date = todayKey()
): Promise<QuestCompletion[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("quest_completions")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date);
    if (!error && data) return data as QuestCompletion[];
  }
  return localStore.getQuests(date);
}

export async function completeQuest(userId: string, questKey: string, date?: string) {
  const resolvedDate = await todayForUser(userId, date);
  const q: QuestCompletion = {
    id: uid(),
    user_id: userId,
    date: resolvedDate,
    quest_key: questKey,
  };

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("quest_completions").upsert(q, {
      onConflict: "user_id,date,quest_key",
    });
    if (error) console.warn("[bloomlog] quest upsert:", error.message);
    else {
      const rare = isRareSeedRoll(userId, resolvedDate, questKey);
      const seed = Math.abs(
        questKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
      );
      const itemDef = randomGardenReward(seed, rare);
      await addGardenItem(userId, itemDef.key, {
        x: 20 + (seed % 60),
        y: 30 + (seed % 40),
        layer: rare ? 2 : 1,
      });
      return { completion: q, rare };
    }
  }

  localStore.addQuest(q);
  const rare = isRareSeedRoll(userId, resolvedDate, questKey);
  const seed = Math.abs(questKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const itemDef = randomGardenReward(seed, rare);
  await addGardenItem(userId, itemDef.key, {
    x: 20 + (seed % 60),
    y: 30 + (seed % 40),
    layer: rare ? 2 : 1,
  });
  return { completion: q, rare };
}

export function getTodaysQuests(userId: string) {
  return pickDailyQuests(userId, todayKey());
}

export async function getGardenItems(userId: string): Promise<GardenItem[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("garden_items")
      .select("*")
      .eq("user_id", userId)
      .order("acquired_at", { ascending: true });
    if (!error && data) return data as GardenItem[];
  }
  return localStore.getGarden();
}

export async function addGardenItem(
  userId: string,
  item_key: string,
  position: { x: number; y: number; layer: number }
) {
  const item: GardenItem = {
    id: uid(),
    user_id: userId,
    item_key,
    acquired_at: new Date().toISOString(),
    position,
    bloom_stage: 0,
  };

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("garden_items").insert(item);
    if (!error) return item;
    console.warn("[bloomlog] garden insert:", error.message);
  }

  localStore.addGardenItem(item);
  return item;
}

export async function getPolaroids(userId: string): Promise<MemoryPolaroid[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("memory_polaroids")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) return data as MemoryPolaroid[];
  }
  return localStore.getPolaroids();
}

export async function logWhisper(userId: string, whisperKey: string) {
  const w: WhisperLog = {
    id: uid(),
    user_id: userId,
    whisper_key: whisperKey,
    shown_at: new Date().toISOString(),
  };

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("whispers_log").insert(w);
    if (!error) return w;
    console.warn("[bloomlog] whisper insert:", error.message);
  }

  localStore.addWhisper(w);
  return w;
}

export async function getJournalLetters(userId: string): Promise<JournalLetter[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("journal_letters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) return data as JournalLetter[];
  }
  const local = localStore.getJournalLetters();
  if (isLocalUserId(userId)) return local;
  return local.filter((l) => l.user_id === userId);
}

export async function addJournalLetter(userId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("letter body required");

  const d = await todayForUser(userId);
  const daily = await getDailyEntry(userId, d);
  const letter: JournalLetter = {
    id: uid(),
    user_id: userId,
    body: trimmed,
    mood_snapshot: daily?.mood ?? null,
    created_at: new Date().toISOString(),
  };

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("journal_letters").insert(letter);
    if (!error) return letter;
    console.warn("[bloomlog] journal insert:", error.message);
  }

  localStore.addJournalLetter(letter);
  return letter;
}

export async function deleteJournalLetter(userId: string, letterId: string) {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase
      .from("journal_letters")
      .delete()
      .eq("user_id", userId)
      .eq("id", letterId);
    if (error) console.warn("[bloomlog] journal delete:", error.message);
  }
  localStore.removeJournalLetter(letterId);
}

export async function getWhispersToday(userId: string): Promise<WhisperLog[]> {
  const today = await todayForUser(userId);
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("whispers_log")
      .select("*")
      .eq("user_id", userId)
      .gte("shown_at", `${today}T00:00:00`);
    if (!error && data) return data as WhisperLog[];
  }
  return localStore.getWhispers().filter((w) => w.shown_at.startsWith(today));
}

export async function exportUserData(userId: string) {
  if (!shouldUseSupabase(userId)) {
    return localStore.exportAll();
  }
  const supabase = createClient()!;
  const [profile, daily, expenses, meals, quests, garden, polaroids, whispers, letters] =
    await Promise.all([
      getProfile(userId),
      supabase.from("daily_entries").select("*").eq("user_id", userId),
      supabase.from("expenses").select("*").eq("user_id", userId),
      supabase.from("meals").select("*").eq("user_id", userId),
      supabase.from("quest_completions").select("*").eq("user_id", userId),
      getGardenItems(userId),
      getPolaroids(userId),
      supabase.from("whispers_log").select("*").eq("user_id", userId),
      getJournalLetters(userId),
    ]);
  return {
    profile,
    daily: daily.data,
    expenses: expenses.data,
    meals: meals.data,
    quests: quests.data,
    garden,
    polaroids,
    whispers: whispers.data,
    letters,
  };
}

export async function deleteAllUserData(userId: string) {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    await Promise.all([
      supabase.from("journal_letters").delete().eq("user_id", userId),
      supabase.from("whispers_log").delete().eq("user_id", userId),
      supabase.from("memory_polaroids").delete().eq("user_id", userId),
      supabase.from("garden_items").delete().eq("user_id", userId),
      supabase.from("quest_completions").delete().eq("user_id", userId),
      supabase.from("meals").delete().eq("user_id", userId),
      supabase.from("expenses").delete().eq("user_id", userId),
      supabase.from("daily_entries").delete().eq("user_id", userId),
      supabase.from("users_profile").delete().eq("id", userId),
    ]);
    await supabase.auth.signOut();
  }
  localStore.clearAll();
}
