"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { localStore } from "@/lib/storage/local";
import { todayKey } from "@/lib/dates";
import { shouldUseSupabase, isLocalUserId } from "@/lib/data/auth";
import type {
  FoodLogEntry,
  FoodFavorite,
  FoodLogSource,
  FoodTag,
  MealSlot,
  AiRecipe,
  AiRecipePayload,
  DailyNutritionSummary,
  DailyEntry,
} from "@/lib/types";
import { aggregateNutrition } from "@/lib/health/nutrition-aggregate";
import { computeHydrationStreak } from "@/lib/health/hydration-streak";

function uid() {
  return crypto.randomUUID();
}

async function todayForUser(userId: string, date?: string): Promise<string> {
  if (date) return date;
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data } = await supabase
      .from("users_profile")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    return todayKey(data?.timezone as string | undefined);
  }
  return todayKey(localStore.getProfile()?.timezone);
}

export async function getFoodLog(
  userId: string,
  date?: string
): Promise<FoodLogEntry[]> {
  const d = await todayForUser(userId, date);
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("food_log_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", d)
      .order("logged_at", { ascending: true });
    if (!error && data?.length) return normalizeFoodLogRows(data);
    if (!error && (!data || data.length === 0)) {
      await migrateMealsToFoodLog(userId, d);
      const { data: retry } = await supabase
        .from("food_log_entries")
        .select("*")
        .eq("user_id", userId)
        .eq("date", d)
        .order("logged_at", { ascending: true });
      if (retry?.length) return normalizeFoodLogRows(retry);
    }
  }
  const local = localStore.getFoodLog(d);
  if (local.length) return local.filter((e) => e.user_id === userId || isLocalUserId(userId));
  const legacy = localStore.getMeals(d);
  if (legacy.length) {
    for (const m of legacy) {
      await addFoodLog(userId, {
        meal_slot: "snack",
        name: "polaroid meal",
        emotional_tags: m.tags,
        photo_url: m.photo_url,
        source: "polaroid",
        date: d,
      });
    }
    return localStore.getFoodLog(d);
  }
  return [];
}

function normalizeFoodLogRows(rows: Record<string, unknown>[]): FoodLogEntry[] {
  return rows.map((r) => ({
    id: r.id as string,
    user_id: r.user_id as string,
    date: r.date as string,
    logged_at: r.logged_at as string,
    meal_slot: r.meal_slot as MealSlot,
    name: (r.name as string) || "meal",
    photo_url: (r.photo_url as string | null) ?? null,
    emotional_tags: (r.emotional_tags as FoodTag[]) ?? [],
    calories: r.calories as number | null,
    protein_g: r.protein_g != null ? Number(r.protein_g) : null,
    carbs_g: r.carbs_g != null ? Number(r.carbs_g) : null,
    fat_g: r.fat_g != null ? Number(r.fat_g) : null,
    fiber_g: r.fiber_g != null ? Number(r.fiber_g) : null,
    journal_note: (r.journal_note as string | null) ?? null,
    source: r.source as FoodLogSource,
    source_meta: (r.source_meta as Record<string, unknown>) ?? {},
    created_at: r.created_at as string,
  }));
}

async function migrateMealsToFoodLog(userId: string, date: string) {
  const supabase = createClient()!;
  const { data: meals } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date);
  if (!meals?.length) return;
  for (const m of meals) {
    const { data: exists } = await supabase
      .from("food_log_entries")
      .select("id")
      .eq("id", m.id)
      .maybeSingle();
    if (exists) continue;
    await supabase.from("food_log_entries").insert({
      id: m.id,
      user_id: m.user_id,
      date: m.date,
      logged_at: m.meal_time ?? new Date().toISOString(),
      meal_slot: "snack",
      name: "polaroid meal",
      photo_url: m.photo_url,
      emotional_tags: m.tags ?? [],
      source: "polaroid",
    });
  }
}

export type AddFoodLogInput = {
  meal_slot: MealSlot;
  name: string;
  emotional_tags?: FoodTag[];
  photo_url?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  journal_note?: string | null;
  source?: FoodLogSource;
  source_meta?: Record<string, unknown>;
  date?: string;
};

export async function addFoodLog(
  userId: string,
  input: AddFoodLogInput
): Promise<FoodLogEntry> {
  const date = await todayForUser(userId, input.date);
  const entry: FoodLogEntry = {
    id: uid(),
    user_id: userId,
    date,
    logged_at: new Date().toISOString(),
    meal_slot: input.meal_slot,
    name: input.name,
    photo_url: input.photo_url ?? null,
    emotional_tags: input.emotional_tags ?? [],
    calories: input.calories ?? null,
    protein_g: input.protein_g ?? null,
    carbs_g: input.carbs_g ?? null,
    fat_g: input.fat_g ?? null,
    fiber_g: null,
    journal_note: input.journal_note ?? null,
    source: input.source ?? "quick",
    source_meta: input.source_meta ?? {},
    created_at: new Date().toISOString(),
  };

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("food_log_entries").insert(entry);
    if (!error) return entry;
    console.warn("[bloomlog] food log insert:", error.message);
  }

  localStore.addFoodLog(entry);
  return entry;
}

export async function deleteFoodLog(userId: string, entryId: string, date?: string) {
  const d = await todayForUser(userId, date);
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    await supabase
      .from("food_log_entries")
      .delete()
      .eq("user_id", userId)
      .eq("id", entryId);
  }
  localStore.removeFoodLog(entryId, d);
}

export async function getDailyNutritionSummary(
  userId: string,
  date?: string
): Promise<DailyNutritionSummary> {
  const entries = await getFoodLog(userId, date);
  return aggregateNutrition(entries);
}

export async function getFoodFavorites(userId: string): Promise<FoodFavorite[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("food_favorites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) return data as FoodFavorite[];
  }
  return localStore.getFoodFavorites().filter((f) => f.user_id === userId);
}

export async function toggleFoodFavorite(
  userId: string,
  item: Omit<FoodFavorite, "id" | "user_id" | "created_at">
): Promise<FoodFavorite> {
  const existing = (await getFoodFavorites(userId)).find((f) => f.name === item.name);
  if (existing) {
    if (shouldUseSupabase(userId)) {
      const supabase = createClient()!;
      await supabase.from("food_favorites").delete().eq("id", existing.id);
    }
    localStore.removeFoodFavorite(existing.id);
    return existing;
  }

  const fav: FoodFavorite = {
    id: uid(),
    user_id: userId,
    ...item,
    created_at: new Date().toISOString(),
  };

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("food_favorites").insert(fav);
    if (!error) return fav;
    console.warn("[bloomlog] favorite insert:", error.message);
  }

  localStore.addFoodFavorite(fav);
  return fav;
}

export async function getRecentFoodNames(userId: string, limit = 10): Promise<string[]> {
  const entries: string[] = [];
  if (shouldUseSupabase(userId) && isSupabaseConfigured()) {
    const supabase = createClient()!;
    const { data } = await supabase
      .from("food_log_entries")
      .select("name")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(40);
    if (data) {
      for (const row of data) {
        const n = row.name as string;
        if (n && !entries.includes(n)) entries.push(n);
        if (entries.length >= limit) break;
      }
      return entries;
    }
  }
  const all = localStore.getAllFoodLogNames();
  return all.slice(0, limit);
}

export async function saveAiRecipe(
  userId: string,
  ingredientsRaw: string,
  ingredientsHash: string,
  payload: AiRecipePayload
): Promise<AiRecipe> {
  const recipe: AiRecipe = {
    id: uid(),
    user_id: userId,
    ingredients_hash: ingredientsHash,
    ingredients_raw: ingredientsRaw,
    payload,
    created_at: new Date().toISOString(),
  };

  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { error } = await supabase.from("ai_recipes").insert({
      ...recipe,
      payload: payload as unknown as Record<string, unknown>,
    });
    if (!error) return recipe;
    console.warn("[bloomlog] ai recipe insert:", error.message);
  }

  localStore.addAiRecipe(recipe);
  return recipe;
}

export async function getAiRecipes(userId: string): Promise<AiRecipe[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data, error } = await supabase
      .from("ai_recipes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      return data.map((r) => ({
        ...r,
        payload: r.payload as AiRecipePayload,
      })) as AiRecipe[];
    }
  }
  return localStore.getAiRecipes().filter((r) => r.user_id === userId);
}

export async function getAiRecipeById(
  userId: string,
  id: string
): Promise<AiRecipe | null> {
  const list = await getAiRecipes(userId);
  return list.find((r) => r.id === id) ?? null;
}

export async function getHydrationHistory(
  userId: string,
  days = 14
): Promise<Pick<DailyEntry, "date" | "water_ml">[]> {
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const end = await todayForUser(userId);
    const { data } = await supabase
      .from("daily_entries")
      .select("date, water_ml")
      .eq("user_id", userId)
      .lte("date", end)
      .order("date", { ascending: false })
      .limit(days);
    if (data) return data as Pick<DailyEntry, "date" | "water_ml">[];
  }
  return localStore.getHydrationHistory(days);
}

export async function getHydrationStreak(userId: string): Promise<number> {
  let goal = 2000;
  let today = todayKey();
  if (shouldUseSupabase(userId)) {
    const supabase = createClient()!;
    const { data } = await supabase
      .from("users_profile")
      .select("water_goal_ml, timezone")
      .eq("id", userId)
      .maybeSingle();
    goal = (data?.water_goal_ml as number) ?? 2000;
    today = todayKey(data?.timezone as string | undefined);
  } else {
    const p = localStore.getProfile();
    goal = p?.water_goal_ml ?? 2000;
    today = todayKey(p?.timezone);
  }
  const history = await getHydrationHistory(userId, 14);
  return computeHydrationStreak(history, goal, today);
}
