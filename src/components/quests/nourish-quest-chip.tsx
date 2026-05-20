"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/primitives/card";
import { buildQuestBoardState } from "@/lib/quests/quest-board";
import type {
  DailyEntry,
  FoodLogEntry,
  JournalLetter,
  QuestCompletion,
  UserProfile,
} from "@/lib/types";

export function NourishQuestChip({
  userId,
  date,
  completions,
  daily,
  foodLog,
  profile,
  letters,
}: {
  userId: string;
  date: string;
  completions: QuestCompletion[];
  daily: DailyEntry | null | undefined;
  foodLog: FoodLogEntry[];
  profile: UserProfile | null | undefined;
  letters: JournalLetter[];
}) {
  const chip = useMemo(() => {
    const board = buildQuestBoardState({
      userId,
      date,
      daily,
      foodLog,
      completions,
      profile,
      letters,
    });
    const done = new Set(completions.map((c) => c.quest_key));
    const nourishQuest = board.dailyQuests.find(
      (q) => q.category === "nourish" || q.category === "hydrate"
    );
    if (!nourishQuest) return null;
    const autoReady = board.autoReady.find((m) => m.key === nourishQuest.key);
    const completed = done.has(nourishQuest.key);
    return { quest: nourishQuest, autoReady, completed };
  }, [userId, date, daily, foodLog, completions, profile, letters]);

  if (!chip) return null;

  const { quest, autoReady, completed } = chip;
  const status = completed
    ? "done"
    : autoReady
      ? "ready"
      : "open";

  return (
    <Card className="!py-3">
      <div className="flex items-center gap-3">
        <span className="text-xl">{quest.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-whisper">today&apos;s tiny win</p>
          <p className="text-sm text-ink truncate">{quest.label}</p>
          {autoReady && !completed && (
            <p className="text-[11px] text-sage mt-0.5">you already did this</p>
          )}
        </div>
        <Link
          href="/dashboard#tiny-quests"
          className="shrink-0 text-xs text-sage whitespace-nowrap"
        >
          {status === "done" ? "on Today ✓" : status === "ready" ? "claim →" : "on Today →"}
        </Link>
      </div>
    </Card>
  );
}
