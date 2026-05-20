import { parse } from "date-fns";
import type { DailyEntry, FoodLogEntry, UserProfile } from "@/lib/types";
import {
  QUEST_POOL,
  getQuestByKey,
  type QuestAutoRule,
  type QuestDefinition,
} from "@/lib/quests/pool";

export interface QuestEvaluateContext {
  daily: DailyEntry | null;
  foodLog: FoodLogEntry[];
  waterGoalMl: number;
  journalToday: boolean;
}

export interface QuestAutoMatch {
  key: string;
  hint: string;
}

function matchesRule(
  rule: QuestAutoRule,
  ctx: QuestEvaluateContext
): boolean {
  const daily = ctx.daily;
  const foodLog = ctx.foodLog;

  switch (rule.type) {
    case "water_goal":
      return (daily?.water_ml ?? 0) >= ctx.waterGoalMl;
    case "water_sips":
      return (daily?.water_ml ?? 0) >= rule.minMl;
    case "food_slot":
      return foodLog.some((e) => e.meal_slot === rule.slot);
    case "food_tag":
      return foodLog.some((e) => e.emotional_tags.includes(rule.tag));
    case "food_source":
      return foodLog.some((e) => e.source === rule.source);
    case "food_name_includes": {
      const sub = rule.substring.toLowerCase();
      return foodLog.some((e) => e.name.toLowerCase().includes(sub));
    }
    case "food_catalog_id":
      return foodLog.some(
        (e) => e.source_meta?.catalog_id === rule.catalogId
      );
    case "journal_letter":
      return ctx.journalToday;
    case "sleep_before": {
      if (!daily?.sleep_end) return false;
      const end = parse(daily.sleep_end, "HH:mm", new Date());
      const h = end.getHours();
      const m = end.getMinutes();
      if (h < rule.hour) return true;
      if (h === rule.hour && m < rule.minute) return true;
      return false;
    }
    case "manual":
      return false;
    default:
      return false;
  }
}

export function evaluateQuestAutoCompletions(
  ctx: QuestEvaluateContext
): QuestAutoMatch[] {
  const matches: QuestAutoMatch[] = [];

  for (const quest of QUEST_POOL) {
    if (!quest.autoRule || quest.autoRule.type === "manual") continue;
    if (!matchesRule(quest.autoRule, ctx)) continue;
    matches.push({
      key: quest.key,
      hint: quest.autoHint ?? "noticed from your day",
    });
  }

  return matches;
}

export function buildEvaluateContext(
  daily: DailyEntry | null,
  foodLog: FoodLogEntry[],
  profile: UserProfile | null | undefined,
  journalToday: boolean
): QuestEvaluateContext {
  return {
    daily,
    foodLog,
    waterGoalMl: profile?.water_goal_ml ?? 2000,
    journalToday,
  };
}

export function getAutoReadyKeys(
  dailyQuests: QuestDefinition[],
  completions: { quest_key: string }[],
  autoMatches: QuestAutoMatch[]
): QuestAutoMatch[] {
  const done = new Set(completions.map((c) => c.quest_key));
  const dailyKeys = new Set(dailyQuests.map((q) => q.key));
  return autoMatches.filter((m) => dailyKeys.has(m.key) && !done.has(m.key));
}

export function journalLetterToday(
  letters: { created_at: string }[],
  date: string,
  timezone?: string
): boolean {
  for (const letter of letters) {
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone ?? "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(letter.created_at));
    if (day === date) return true;
  }
  return false;
}

export function questAutoHint(key: string): string | undefined {
  return getQuestByKey(key)?.autoHint;
}
