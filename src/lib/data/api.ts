"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { localStore, getOrCreateGuestId } from "@/lib/storage/local";
import { todayKey } from "@/lib/dates";
import type {
  DailyEntry,
  Expense,
  GardenItem,
  Meal,
  MemoryPolaroid,
  QuestCompletion,
  UserProfile,
  WhisperLog,
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

export async function ensureAuth(): Promise<string> {
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) return data.user.id;
    const { data: anon } = await supabase.auth.signInAnonymously();
    if (anon.user) return anon.user.id;
  }
  return getOrCreateGuestId();
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase
      .from("users_profile")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) return data as UserProfile;
  }
  return localStore.getProfile();
}

export async function upsertProfile(
  userId: string,
  patch: Partial<UserProfile>
): Promise<UserProfile> {
  const existing = (await getProfile(userId)) ?? {
    id: userId,
    display_name: null,
    cozy_hour: "21:00",
    room_theme: "windowsill" as RoomTheme,
    onboarding_complete: false,
    notifications_enabled: false,
    finance_enabled: true,
    created_at: new Date().toISOString(),
  };
  const merged = { ...existing, ...patch, id: userId };
  const supabase = createClient();
  if (supabase) {
    await supabase.from("users_profile").upsert(merged);
  } else {
    localStore.setProfile(merged);
  }
  return merged;
}

export async function getDailyEntry(
  userId: string,
  date = todayKey()
): Promise<DailyEntry | null> {
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();
    if (data) return data as DailyEntry;
  }
  const local = localStore.getDaily(date);
  return local?.user_id === userId ? local : localStore.getDaily(date);
}

export async function upsertDailyEntry(
  userId: string,
  patch: Partial<DailyEntry> & { date?: string }
): Promise<DailyEntry> {
  const date = patch.date ?? todayKey();
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
  const supabase = createClient();
  if (supabase) {
    await supabase.from("daily_entries").upsert(merged);
  } else {
    localStore.setDaily(merged);
  }
  return merged;
}

export async function setMood(userId: string, mood: Mood) {
  return upsertDailyEntry(userId, { mood });
}

export async function addWater(userId: string, ml: number) {
  const entry = await getDailyEntry(userId);
  const water_ml = (entry?.water_ml ?? 0) + ml;
  return upsertDailyEntry(userId, { water_ml });
}

export async function setNote(userId: string, note: string) {
  return upsertDailyEntry(userId, { note: note || null });
}

export async function setSleep(
  userId: string,
  sleep_start: string,
  sleep_end: string,
  sleep_quality: SleepQuality | null
) {
  return upsertDailyEntry(userId, { sleep_start, sleep_end, sleep_quality });
}

export async function getExpenses(
  userId: string,
  date = todayKey()
): Promise<Expense[]> {
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: true });
    return (data as Expense[]) ?? [];
  }
  return localStore.getExpenses(date);
}

export async function addExpense(
  userId: string,
  category: ExpenseCategory,
  amount: number,
  note?: string
) {
  const expense: Expense = {
    id: uid(),
    user_id: userId,
    date: todayKey(),
    category,
    amount,
    note: note ?? null,
    created_at: new Date().toISOString(),
  };
  const supabase = createClient();
  if (supabase) {
    await supabase.from("expenses").insert(expense);
  } else {
    localStore.addExpense(expense);
  }
  return expense;
}

export async function getMeals(userId: string, date = todayKey()): Promise<Meal[]> {
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("meal_time", { ascending: true });
    return (data as Meal[]) ?? [];
  }
  return localStore.getMeals(date);
}

export async function addMeal(
  userId: string,
  tags: FoodTag[],
  photo_url?: string | null
) {
  const meal: Meal = {
    id: uid(),
    user_id: userId,
    date: todayKey(),
    meal_time: new Date().toISOString(),
    photo_url: photo_url ?? null,
    tags,
  };
  const supabase = createClient();
  if (supabase) {
    await supabase.from("meals").insert(meal);
  } else {
    localStore.addMeal(meal);
  }
  return meal;
}

export async function getQuestCompletions(
  userId: string,
  date = todayKey()
): Promise<QuestCompletion[]> {
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase
      .from("quest_completions")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date);
    return (data as QuestCompletion[]) ?? [];
  }
  return localStore.getQuests(date);
}

export async function completeQuest(userId: string, questKey: string) {
  const date = todayKey();
  const q: QuestCompletion = {
    id: uid(),
    user_id: userId,
    date,
    quest_key: questKey,
  };
  const supabase = createClient();
  if (supabase) {
    await supabase.from("quest_completions").upsert(q, {
      onConflict: "user_id,date,quest_key",
    });
  } else {
    localStore.addQuest(q);
  }

  const rare = isRareSeedRoll(userId, date, questKey);
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
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase
      .from("garden_items")
      .select("*")
      .eq("user_id", userId)
      .order("acquired_at", { ascending: true });
    return (data as GardenItem[]) ?? [];
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
  const supabase = createClient();
  if (supabase) {
    await supabase.from("garden_items").insert(item);
  } else {
    localStore.addGardenItem(item);
  }
  return item;
}

export async function getPolaroids(userId: string): Promise<MemoryPolaroid[]> {
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase
      .from("memory_polaroids")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data as MemoryPolaroid[]) ?? [];
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
  const supabase = createClient();
  if (supabase) {
    await supabase.from("whispers_log").insert(w);
  } else {
    localStore.addWhisper(w);
  }
  return w;
}

export async function getWhispersToday(userId: string): Promise<WhisperLog[]> {
  const today = todayKey();
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase
      .from("whispers_log")
      .select("*")
      .eq("user_id", userId)
      .gte("shown_at", `${today}T00:00:00`);
    return (data as WhisperLog[]) ?? [];
  }
  return localStore
    .getWhispers()
    .filter((w) => w.shown_at.startsWith(today));
}

export async function exportUserData(userId: string) {
  if (!isSupabaseConfigured()) {
    return localStore.exportAll();
  }
  const supabase = createClient();
  if (!supabase) return localStore.exportAll();
  const [profile, daily, expenses, meals, quests, garden, polaroids, whispers] =
    await Promise.all([
      getProfile(userId),
      supabase.from("daily_entries").select("*").eq("user_id", userId),
      supabase.from("expenses").select("*").eq("user_id", userId),
      supabase.from("meals").select("*").eq("user_id", userId),
      supabase.from("quest_completions").select("*").eq("user_id", userId),
      getGardenItems(userId),
      getPolaroids(userId),
      supabase.from("whispers_log").select("*").eq("user_id", userId),
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
  };
}

export async function deleteAllUserData(userId: string) {
  const supabase = createClient();
  if (supabase) {
    await Promise.all([
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
