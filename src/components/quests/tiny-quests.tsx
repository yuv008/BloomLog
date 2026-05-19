"use client";

import { m } from "framer-motion";
import { Card } from "@/components/primitives/card";
import { getTodaysQuests } from "@/lib/data/api";
import type { QuestCompletion } from "@/lib/types";
import { useUiStore } from "@/stores/use-ui-store";

export function TinyQuestsCard({
  userId,
  completions,
  onComplete,
}: {
  userId: string;
  completions: QuestCompletion[];
  onComplete: (questKey: string) => Promise<{ rare: boolean }>;
}) {
  const quests = getTodaysQuests(userId);
  const done = new Set(completions.map((c) => c.quest_key));
  const triggerPetal = useUiStore((s) => s.triggerPetalBurst);
  const bloomCount = completions.length;

  return (
    <Card>
      <div className="flex items-baseline justify-between mb-3">
        <p className="font-display text-lg text-ink">tiny quests</p>
        <p className="text-xs text-whisper">bloom this week · {bloomCount} today</p>
      </div>
      <ul className="space-y-2">
        {quests.map((q) => {
          const completed = done.has(q.key);
          return (
            <li key={q.key}>
              <m.button
                type="button"
                disabled={completed}
                onClick={async () => {
                  const { rare } = await onComplete(q.key);
                  triggerPetal();
                  if (rare && navigator.vibrate) navigator.vibrate([20, 40, 20]);
                }}
                whileTap={completed ? undefined : { scale: 0.97, opacity: 0.9 }}
                className={`flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left transition-colors ${
                  completed ? "bg-sage/20 text-whisper line-through" : "bg-beige/30 text-ink"
                }`}
              >
                <span className="text-xl">{q.emoji}</span>
                <span className="text-sm">{q.label}</span>
                {completed && <span className="ml-auto text-sage">✓</span>}
              </m.button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
