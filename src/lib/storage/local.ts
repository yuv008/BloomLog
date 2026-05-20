"use client";

import type {
  AiRecipe,
  CalendarEvent,
  DailyEntry,
  Expense,
  FoodFavorite,
  FoodLogEntry,
  GardenItem,
  JournalLetter,
  Meal,
  MemoryPolaroid,
  QuestCompletion,
  RecurrenceRule,
  RoutineTemplate,
  UserProfile,
  WhisperLog,
} from "@/lib/types";
import { todayKey } from "@/lib/dates";
import { hasMealPhoto } from "@/lib/media/meal-photo-url";

const PREFIX = "bloomlog_";

function key(name: string) {
  return `${PREFIX}${name}`;
}

function read<T>(name: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key(name));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(name: string, value: T) {
  localStorage.setItem(key(name), JSON.stringify(value));
}

export function getOrCreateGuestId(): string {
  let id = read<string | null>("guest_id", null);
  if (!id) {
    id = `guest_${crypto.randomUUID()}`;
    write("guest_id", id);
  }
  return id;
}

export const localStore = {
  getProfile(): UserProfile | null {
    return read("profile", null);
  },
  setProfile(profile: UserProfile) {
    write("profile", profile);
  },
  getDaily(date: string): DailyEntry | null {
    const all = read<Record<string, DailyEntry>>("daily", {});
    return all[date] ?? null;
  },
  setDaily(entry: DailyEntry) {
    const all = read<Record<string, DailyEntry>>("daily", {});
    all[entry.date] = entry;
    write("daily", all);
  },
  getExpenses(date: string): Expense[] {
    const all = read<Record<string, Expense[]>>("expenses", {});
    return all[date] ?? [];
  },
  getExpensesForMonth(month: string): Expense[] {
    const all = read<Record<string, Expense[]>>("expenses", {});
    return Object.entries(all).flatMap(([date, list]) =>
      date.startsWith(month) ? list : []
    );
  },
  addExpense(expense: Expense) {
    const all = read<Record<string, Expense[]>>("expenses", {});
    const list = all[expense.date] ?? [];
    all[expense.date] = [...list, expense];
    write("expenses", all);
  },
  removeExpense(id: string, date: string) {
    const all = read<Record<string, Expense[]>>("expenses", {});
    all[date] = (all[date] ?? []).filter((e) => e.id !== id);
    write("expenses", all);
  },
  getMeals(date: string): Meal[] {
    const all = read<Record<string, Meal[]>>("meals", {});
    return all[date] ?? [];
  },
  addMeal(meal: Meal) {
    const all = read<Record<string, Meal[]>>("meals", {});
    const list = all[meal.date] ?? [];
    all[meal.date] = [...list, meal];
    write("meals", all);
  },
  getFoodLog(date: string): FoodLogEntry[] {
    const all = read<Record<string, FoodLogEntry[]>>("food_log", {});
    return all[date] ?? [];
  },
  addFoodLog(entry: FoodLogEntry) {
    const all = read<Record<string, FoodLogEntry[]>>("food_log", {});
    const list = all[entry.date] ?? [];
    all[entry.date] = [...list, entry];
    write("food_log", all);
  },
  removeFoodLog(id: string, date: string) {
    const all = read<Record<string, FoodLogEntry[]>>("food_log", {});
    all[date] = (all[date] ?? []).filter((e) => e.id !== id);
    write("food_log", all);
  },
  getAllFoodLogNames(): string[] {
    const all = read<Record<string, FoodLogEntry[]>>("food_log", {});
    const names: string[] = [];
    for (const list of Object.values(all)) {
      for (const e of list) {
        if (!names.includes(e.name)) names.push(e.name);
      }
    }
    return names;
  },
  getAllFoodLogWithPhotos(): FoodLogEntry[] {
    const all = read<Record<string, FoodLogEntry[]>>("food_log", {});
    return Object.values(all)
      .flat()
      .filter((e) => hasMealPhoto(e))
      .sort((a, b) => b.logged_at.localeCompare(a.logged_at));
  },
  getFoodFavorites(): FoodFavorite[] {
    return read("food_favorites", []);
  },
  addFoodFavorite(fav: FoodFavorite) {
    const list = read<FoodFavorite[]>("food_favorites", []);
    write("food_favorites", [...list.filter((f) => f.name !== fav.name), fav]);
  },
  removeFoodFavorite(id: string) {
    const list = read<FoodFavorite[]>("food_favorites", []);
    write(
      "food_favorites",
      list.filter((f) => f.id !== id)
    );
  },
  getAiRecipes(): AiRecipe[] {
    return read("ai_recipes", []);
  },
  addAiRecipe(recipe: AiRecipe) {
    const list = read<AiRecipe[]>("ai_recipes", []);
    write("ai_recipes", [recipe, ...list]);
  },
  getHydrationHistory(
    days: number,
    timeZone?: string
  ): Pick<DailyEntry, "date" | "water_ml">[] {
    const all = read<Record<string, DailyEntry>>("daily", {});
    const today = todayKey(timeZone);
    return Object.values(all)
      .filter((e) => e.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, days)
      .map((e) => ({ date: e.date, water_ml: e.water_ml }));
  },
  getQuests(date: string): QuestCompletion[] {
    const all = read<Record<string, QuestCompletion[]>>("quests", {});
    return all[date] ?? [];
  },
  addQuest(q: QuestCompletion) {
    const all = read<Record<string, QuestCompletion[]>>("quests", {});
    const list = all[q.date] ?? [];
    if (list.some((x) => x.quest_key === q.quest_key)) return;
    all[q.date] = [...list, q];
    write("quests", all);
  },
  getGarden(): GardenItem[] {
    return read("garden", []);
  },
  addGardenItem(item: GardenItem) {
    const items = read<GardenItem[]>("garden", []);
    write("garden", [...items, item]);
  },
  getPolaroids(): MemoryPolaroid[] {
    return read("polaroids", []);
  },
  addPolaroid(p: MemoryPolaroid) {
    const list = read<MemoryPolaroid[]>("polaroids", []);
    write("polaroids", [...list, p]);
  },
  getWhispers(): WhisperLog[] {
    return read("whispers", []);
  },
  addWhisper(w: WhisperLog) {
    const list = read<WhisperLog[]>("whispers", []);
    write("whispers", [...list, w]);
  },
  getJournalLetters(): JournalLetter[] {
    const list = read<JournalLetter[]>("letters", []);
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },
  addJournalLetter(letter: JournalLetter) {
    const list = read<JournalLetter[]>("letters", []);
    write("letters", [letter, ...list]);
  },
  removeJournalLetter(id: string) {
    const list = read<JournalLetter[]>("letters", []);
    write(
      "letters",
      list.filter((l) => l.id !== id)
    );
  },
  getCalendarEvents(): CalendarEvent[] {
    return read<CalendarEvent[]>("calendar_events", []);
  },
  upsertCalendarEvent(event: CalendarEvent) {
    const list = read<CalendarEvent[]>("calendar_events", []);
    const idx = list.findIndex((e) => e.id === event.id);
    if (idx >= 0) list[idx] = event;
    else list.push(event);
    write("calendar_events", list);
  },
  getRoutineTemplates(): RoutineTemplate[] {
    return read<RoutineTemplate[]>("routine_templates", []);
  },
  upsertRoutineTemplate(tpl: RoutineTemplate) {
    const list = read<RoutineTemplate[]>("routine_templates", []);
    const idx = list.findIndex((r) => r.id === tpl.id);
    if (idx >= 0) list[idx] = tpl;
    else list.push(tpl);
    write("routine_templates", list);
  },
  getRecurrenceRules(): RecurrenceRule[] {
    return read<RecurrenceRule[]>("recurrence_rules", []);
  },
  upsertRecurrenceRule(rule: RecurrenceRule) {
    const list = read<RecurrenceRule[]>("recurrence_rules", []);
    const idx = list.findIndex((r) => r.id === rule.id);
    if (idx >= 0) list[idx] = rule;
    else list.push(rule);
    write("recurrence_rules", list);
  },
  getPendingCalendarOps(): Array<{
    op: "create" | "update" | "complete" | "delete";
    payload: Record<string, unknown>;
    at: string;
  }> {
    return read("pending_calendar_ops", []);
  },
  queueCalendarOp(
    op: "create" | "update" | "complete" | "delete",
    payload: Record<string, unknown>
  ) {
    const q = read<
      Array<{ op: typeof op; payload: Record<string, unknown>; at: string }>
    >("pending_calendar_ops", []);
    q.push({ op, payload, at: new Date().toISOString() });
    write("pending_calendar_ops", q);
  },
  flushPendingCalendarOps() {
    write("pending_calendar_ops", []);
  },
  exportAll() {
    return {
      profile: read("profile", null),
      daily: read("daily", {}),
      expenses: read("expenses", {}),
      meals: read("meals", {}),
      food_log: read("food_log", {}),
      food_favorites: read("food_favorites", []),
      ai_recipes: read("ai_recipes", []),
      quests: read("quests", {}),
      garden: read("garden", []),
      polaroids: read("polaroids", []),
      whispers: read("whispers", []),
      letters: read("letters", []),
      calendar_events: read("calendar_events", []),
      routine_templates: read("routine_templates", []),
      recurrence_rules: read("recurrence_rules", []),
    };
  },
  clearAll() {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(PREFIX)
    );
    keys.forEach((k) => localStorage.removeItem(k));
  },
};
