export interface QuestDefinition {
  key: string;
  label: string;
  emoji: string;
}

export const QUEST_POOL: QuestDefinition[] = [
  { key: "water_enough", label: "drank enough water", emoji: "💧" },
  { key: "sleep_before_1", label: "slept before 1am", emoji: "🌙" },
  { key: "ate_fruit", label: "ate a fruit", emoji: "🍓" },
  { key: "walked_outside", label: "walked outside", emoji: "🌿" },
  { key: "no_impulse", label: "no impulse shopping", emoji: "🛍️" },
  { key: "kind_text", label: "texted someone kind", emoji: "💌" },
  { key: "phone_down", label: "phone down by 11", emoji: "📵" },
  { key: "made_bed", label: "made the bed", emoji: "🛏️" },
  { key: "stretch", label: "stretched for a minute", emoji: "🧘" },
  { key: "tea_moment", label: "had a quiet tea moment", emoji: "🍵" },
  { key: "read_pages", label: "read a few pages", emoji: "📖" },
  { key: "tidy_corner", label: "tidied one small corner", emoji: "✨" },
  { key: "sunlight", label: "got a bit of sunlight", emoji: "☀️" },
  { key: "homemade", label: "ate something homemade", emoji: "🥣" },
  { key: "log_breakfast", label: "logged a morning bite", emoji: "🌅" },
  { key: "hydrate_3", label: "sipped water three times", emoji: "💧" },
  { key: "cook_at_home", label: "cooked or prepped at home", emoji: "🍳" },
  { key: "deep_breath", label: "took three deep breaths", emoji: "🌬️" },
  { key: "journal_line", label: "wrote one honest line", emoji: "📝" },
  { key: "no_compare", label: "didn't compare today", emoji: "🕊️" },
  { key: "early_shower", label: "took a cozy shower", emoji: "🚿" },
  { key: "plants_water", label: "watered a plant", emoji: "🪴" },
  { key: "music_soft", label: "played soft music", emoji: "🎵" },
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function pickDailyQuests(userId: string, date: string, count = 3): QuestDefinition[] {
  const seed = hashString(`${userId}:${date}`);
  const shuffled = [...QUEST_POOL].sort((a, b) => {
    const ha = hashString(`${seed}:${a.key}`);
    const hb = hashString(`${seed}:${b.key}`);
    return ha - hb;
  });
  return shuffled.slice(0, count);
}

export function isRareSeedRoll(userId: string, date: string, questKey: string): boolean {
  const roll = hashString(`${userId}:${date}:${questKey}`) % 7;
  return roll === 0;
}
