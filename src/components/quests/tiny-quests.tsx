"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { Card } from "@/components/primitives/card";
import { buildQuestBoardState } from "@/lib/quests/quest-board";
import { questAutoHint } from "@/lib/quests/evaluate";
import type {
  DailyEntry,
  FoodLogEntry,
  JournalLetter,
  QuestCompletion,
  UserProfile,
} from "@/lib/types";
import { useUiStore } from "@/stores/use-ui-store";

type RowState = "completed" | "auto_ready" | "manual";

export function TinyQuestsCard({
  userId,
  date,
  completions,
  daily,
  foodLog,
  profile,
  letters,
  onComplete,
}: {
  userId: string;
  date: string;
  completions: QuestCompletion[];
  daily: DailyEntry | null | undefined;
  foodLog: FoodLogEntry[];
  profile: UserProfile | null | undefined;
  letters: JournalLetter[];
  onComplete: (
    questKey: string,
    via: "manual" | "auto"
  ) => Promise<{ rare: boolean; gardenGranted: boolean }>;
}) {
  const board = useMemo(
    () =>
      buildQuestBoardState({
        userId,
        date,
        daily,
        foodLog,
        completions,
        profile,
        letters,
      }),
    [userId, date, daily, foodLog, completions, profile, letters]
  );

  const done = new Set(completions.map((c) => c.quest_key));
  const autoReadyMap = new Map(board.autoReady.map((m) => [m.key, m.hint]));
  const triggerPetal = useUiStore((s) => s.triggerPetalBurst);
  const bloomCount = completions.length;
  const allDone = board.dailyQuests.every((q) => done.has(q.key));

  const rowState = (key: string): RowState => {
    if (done.has(key)) return "completed";
    if (autoReadyMap.has(key)) return "auto_ready";
    return "manual";
  };

  const handleComplete = async (key: string, via: "manual" | "auto") => {
    const { rare, gardenGranted } = await onComplete(key, via);
    const willBeAllDone =
      bloomCount + 1 >= board.dailyQuests.length &&
      board.dailyQuests.every((q) => done.has(q.key) || q.key === key);
    if (gardenGranted || willBeAllDone || allDone) {
      triggerPetal();
    }
    if (rare && navigator.vibrate) navigator.vibrate([20, 40, 20]);
  };

  return (
    <Card id="tiny-quests">
      <div className="flex items-baseline justify-between mb-3">
        <p className="font-display text-lg text-ink">tiny quests</p>
        <p className="text-xs text-whisper">
          {bloomCount === 1
            ? "1 tiny win today"
            : `${bloomCount} tiny wins today`}
        </p>
      </div>
      <ul className="space-y-2">
        {board.dailyQuests.map((q) => {
          const state = rowState(q.key);
          const completed = state === "completed";
          const autoReady = state === "auto_ready";
          const hint = autoReadyMap.get(q.key);

          return (
            <li key={q.key}>
              <m.button
                type="button"
                disabled={completed}
                onClick={() => {
                  if (!completed) {
                    void handleComplete(q.key, autoReady ? "auto" : "manual");
                  }
                }}
                whileTap={completed ? undefined : { scale: 0.97, opacity: 0.9 }}
                className={`flex w-full flex-col items-stretch gap-0.5 rounded-[20px] px-4 py-3 text-left transition-colors ${
                  completed
                    ? "bg-sage/20 text-whisper line-through"
                    : autoReady
                      ? "border border-sage/40 bg-sage/10 text-ink"
                      : "bg-beige/30 text-ink"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{q.emoji}</span>
                  <span className="text-sm flex-1">{q.label}</span>
                  {completed && <span className="text-sage">✓</span>}
                </span>
                {autoReady && hint && (
                  <span className="text-[11px] text-sage pl-9">
                    you already did this · tap to claim
                  </span>
                )}
                {completed &&
                  board.autoMatches.some((m) => m.key === q.key) &&
                  questAutoHint(q.key) && (
                    <span className="text-[11px] text-whisper/80 pl-9 no-underline">
                      {questAutoHint(q.key)}
                    </span>
                  )}
              </m.button>
            </li>
          );
        })}

        {board.bonus && !done.has(board.bonus.key) && (
          <li>
            <m.button
              type="button"
              onClick={() => void handleComplete(board.bonus!.key, "auto")}
              whileTap={{ scale: 0.97, opacity: 0.9 }}
              className="flex w-full flex-col rounded-[20px] border border-dashed border-sage/30 bg-beige/20 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">{board.bonus.emoji}</span>
                <span className="text-sm text-ink flex-1">{board.bonus.label}</span>
              </span>
              <span className="text-[11px] text-whisper pl-9 mt-0.5">
                also noticed · tap to acknowledge
              </span>
            </m.button>
          </li>
        )}
      </ul>
    </Card>
  );
}
