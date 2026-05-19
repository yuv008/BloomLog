"use client";

import type {
  DailyEntry,
  Expense,
  GardenItem,
  JournalLetter,
  Meal,
  MemoryPolaroid,
  QuestCompletion,
  UserProfile,
  WhisperLog,
} from "@/lib/types";

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
  exportAll() {
    return {
      profile: read("profile", null),
      daily: read("daily", {}),
      expenses: read("expenses", {}),
      meals: read("meals", {}),
      quests: read("quests", {}),
      garden: read("garden", []),
      polaroids: read("polaroids", []),
      whispers: read("whispers", []),
      letters: read("letters", []),
    };
  },
  clearAll() {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(PREFIX)
    );
    keys.forEach((k) => localStorage.removeItem(k));
  },
};
