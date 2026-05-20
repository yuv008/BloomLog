import {
  pickDailyQuests,
  pickBonusNoticedQuest,
  type QuestDefinition,
} from "@/lib/quests/pool";
import {
  buildEvaluateContext,
  evaluateQuestAutoCompletions,
  getAutoReadyKeys,
  journalLetterToday,
  type QuestAutoMatch,
} from "@/lib/quests/evaluate";
import type {
  DailyEntry,
  FoodLogEntry,
  JournalLetter,
  QuestCompletion,
  UserProfile,
} from "@/lib/types";

export interface QuestBoardState {
  dailyQuests: QuestDefinition[];
  completions: QuestCompletion[];
  autoReady: QuestAutoMatch[];
  autoMatches: QuestAutoMatch[];
  bonus: QuestDefinition | null;
}

export function buildQuestBoardState(input: {
  userId: string;
  date: string;
  daily: DailyEntry | null | undefined;
  foodLog: FoodLogEntry[];
  completions: QuestCompletion[];
  profile: UserProfile | null | undefined;
  letters: JournalLetter[];
}): QuestBoardState {
  const journalToday = journalLetterToday(
    input.letters,
    input.date,
    input.profile?.timezone
  );
  const ctx = buildEvaluateContext(
    input.daily ?? null,
    input.foodLog,
    input.profile,
    journalToday
  );
  const autoMatches = evaluateQuestAutoCompletions(ctx);
  const dailyQuests = pickDailyQuests(
    input.userId,
    input.date,
    3,
    input.daily?.mood ?? null
  );
  const autoReady = getAutoReadyKeys(
    dailyQuests,
    input.completions,
    autoMatches
  );
  const bonus = pickBonusNoticedQuest(
    input.userId,
    input.date,
    autoMatches.map((m) => m.key),
    dailyQuests.map((q) => q.key)
  );

  return {
    dailyQuests,
    completions: input.completions,
    autoReady,
    autoMatches,
    bonus,
  };
}
