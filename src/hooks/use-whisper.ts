"use client";

import { useEffect, useState } from "react";
import { pickWhisper } from "@/lib/whispers/picker";
import { WHISPER_LIBRARY } from "@/lib/whispers/library";
import { logWhisper, getWhispersToday } from "@/lib/data/api";
import { useUiStore } from "@/stores/use-ui-store";
import type { Mood } from "@/lib/types";

export function useWhisper(
  userId: string | null,
  mood: Mood | null,
  waterMl: number,
  questsCompleted: number
) {
  const [text, setText] = useState<string | null>(null);
  const sessionCount = useUiStore((s) => s.sessionCount);
  const viewedShelf = useUiStore((s) => s.viewedShelf);
  const activeWhisper = useUiStore((s) => s.activeWhisper);
  const setActiveWhisper = useUiStore((s) => s.setActiveWhisper);

  useEffect(() => {
    if (!userId || activeWhisper) return;

    getWhispersToday(userId).then(async (shown) => {
      const whisper = pickWhisper({
        mood,
        waterMl,
        questsCompletedToday: questsCompleted,
        viewedShelf,
        shownTodayKeys: shown.map((s) => s.whisper_key),
        sessionCount,
      });
      if (!whisper) return;
      const entry = WHISPER_LIBRARY.find((w) => w.key === whisper.key);
      if (!entry) return;
      await logWhisper(userId, entry.key);
      setText(entry.text);
      setActiveWhisper(entry.key);
    });
  }, [
    userId,
    mood,
    waterMl,
    questsCompleted,
    viewedShelf,
    sessionCount,
    activeWhisper,
    setActiveWhisper,
  ]);

  const dismiss = () => {
    setText(null);
    setActiveWhisper(null);
  };

  return { text, show: !!text, dismiss };
}
