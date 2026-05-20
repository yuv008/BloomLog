import type { FoodLogSource, FoodTag, MealSlot, Mood } from "@/lib/types";

export type QuestCategory =
  | "hydrate"
  | "nourish"
  | "rest"
  | "move"
  | "calm"
  | "connect";

export type QuestAutoRule =
  | { type: "water_goal" }
  | { type: "water_sips"; minMl: number }
  | { type: "food_slot"; slot: MealSlot }
  | { type: "food_tag"; tag: FoodTag }
  | { type: "food_source"; source: FoodLogSource }
  | { type: "food_name_includes"; substring: string }
  | { type: "food_catalog_id"; catalogId: string }
  | { type: "journal_letter" }
  | { type: "sleep_before"; hour: number; minute: number }
  | { type: "manual" };

export interface QuestDefinition {
  key: string;
  label: string;
  emoji: string;
  category: QuestCategory;
  autoRule?: QuestAutoRule;
  manualOnly?: boolean;
  autoHint?: string;
}

export const QUEST_POOL: QuestDefinition[] = [
  {
    key: "water_enough",
    label: "drank enough water",
    emoji: "💧",
    category: "hydrate",
    autoRule: { type: "water_goal" },
    autoHint: "noticed from your water log",
  },
  {
    key: "hydrate_3",
    label: "sipped water three times",
    emoji: "💧",
    category: "hydrate",
    autoRule: { type: "water_sips", minMl: 750 },
    autoHint: "noticed from your sips today",
  },
  {
    key: "log_breakfast",
    label: "logged a morning bite",
    emoji: "🌅",
    category: "nourish",
    autoRule: { type: "food_slot", slot: "breakfast" },
    autoHint: "noticed from your morning log",
  },
  {
    key: "homemade",
    label: "ate something homemade",
    emoji: "🥣",
    category: "nourish",
    autoRule: { type: "food_tag", tag: "homemade" },
    autoHint: "noticed from what you logged",
  },
  {
    key: "cook_at_home",
    label: "cooked or prepped at home",
    emoji: "🍳",
    category: "nourish",
    autoRule: { type: "food_source", source: "recipe" },
    autoHint: "noticed from a cozy recipe",
  },
  {
    key: "ate_fruit",
    label: "ate a fruit",
    emoji: "🍓",
    category: "nourish",
    autoRule: { type: "food_catalog_id", catalogId: "fruit" },
    autoHint: "noticed from your food log",
  },
  {
    key: "journal_line",
    label: "wrote one honest line",
    emoji: "📝",
    category: "calm",
    autoRule: { type: "journal_letter" },
    autoHint: "noticed from your journal",
  },
  {
    key: "sleep_before_1",
    label: "slept before 1am",
    emoji: "🌙",
    category: "rest",
    autoRule: { type: "sleep_before", hour: 1, minute: 0 },
    autoHint: "noticed from your sleep log",
  },
  { key: "walked_outside", label: "walked outside", emoji: "🌿", category: "move" },
  { key: "stretch", label: "stretched for a minute", emoji: "🧘", category: "move" },
  { key: "sunlight", label: "got a bit of sunlight", emoji: "☀️", category: "move" },
  { key: "tea_moment", label: "had a quiet tea moment", emoji: "🍵", category: "calm" },
  { key: "deep_breath", label: "took three deep breaths", emoji: "🌬️", category: "calm" },
  { key: "read_pages", label: "read a few pages", emoji: "📖", category: "calm" },
  { key: "music_soft", label: "played soft music", emoji: "🎵", category: "calm" },
  { key: "early_shower", label: "took a cozy shower", emoji: "🚿", category: "calm" },
  { key: "made_bed", label: "made the bed", emoji: "🛏️", category: "calm" },
  { key: "tidy_corner", label: "tidied one small corner", emoji: "✨", category: "calm" },
  { key: "plants_water", label: "watered a plant", emoji: "🪴", category: "calm" },
  { key: "kind_text", label: "texted someone kind", emoji: "💌", category: "connect" },
  { key: "phone_down", label: "phone down by 11", emoji: "📵", category: "rest", manualOnly: true },
  { key: "no_impulse", label: "no impulse shopping", emoji: "🛍️", category: "connect", manualOnly: true },
  { key: "no_compare", label: "didn't compare today", emoji: "🕊️", category: "calm", manualOnly: true },
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const PICK_SLOTS: QuestCategory[] = ["hydrate", "nourish", "rest", "calm"];

const MOOD_QUEST_BIAS: Partial<Record<Mood, string[]>> = {
  rainy: ["tea_moment", "deep_breath", "read_pages", "music_soft"],
  stormy: ["deep_breath", "tea_moment", "early_shower"],
  sunny: ["walked_outside", "sunlight", "stretch"],
  golden_hour: ["walked_outside", "sunlight", "kind_text"],
  cozy: ["tea_moment", "made_bed", "read_pages"],
  dreamy: ["music_soft", "read_pages", "journal_line"],
  sleepy: ["early_shower", "made_bed", "tea_moment"],
};

export function getQuestByKey(key: string): QuestDefinition | undefined {
  return QUEST_POOL.find((q) => q.key === key);
}

export function pickDailyQuests(
  userId: string,
  date: string,
  count = 3,
  mood?: Mood | null
): QuestDefinition[] {
  const seed = hashString(`${userId}:${date}`);
  const pool = QUEST_POOL.filter((q) => !q.manualOnly);
  const picked: QuestDefinition[] = [];
  const used = new Set<string>();

  for (const slot of PICK_SLOTS) {
    const candidates = pool.filter((q) => q.category === slot && !used.has(q.key));
    if (!candidates.length) continue;

    const biased = mood ? MOOD_QUEST_BIAS[mood] : undefined;
    const sorted = [...candidates].sort((a, b) => {
      const aBias = biased?.includes(a.key) ? -1 : 0;
      const bBias = biased?.includes(b.key) ? -1 : 0;
      if (aBias !== bBias) return aBias - bBias;
      return hashString(`${seed}:${a.key}`) - hashString(`${seed}:${b.key}`);
    });

    picked.push(sorted[0]!);
    used.add(sorted[0]!.key);
  }

  if (picked.length < count) {
    const rest = pool
      .filter((q) => !used.has(q.key))
      .sort(
        (a, b) => hashString(`${seed}:${a.key}`) - hashString(`${seed}:${b.key}`)
      );
    for (const q of rest) {
      if (picked.length >= count) break;
      picked.push(q);
      used.add(q.key);
    }
  }

  return picked.slice(0, count);
}

export function isRareSeedRoll(userId: string, date: string, questKey: string): boolean {
  const roll = hashString(`${userId}:${date}:${questKey}`) % 7;
  return roll === 0;
}

export function pickBonusNoticedQuest(
  userId: string,
  date: string,
  autoKeys: string[],
  dailyKeys: string[]
): QuestDefinition | null {
  const extra = autoKeys.filter((k) => !dailyKeys.includes(k));
  if (!extra.length) return null;
  const seed = hashString(`${userId}:${date}:bonus`);
  const key = extra[seed % extra.length]!;
  return getQuestByKey(key) ?? null;
}
