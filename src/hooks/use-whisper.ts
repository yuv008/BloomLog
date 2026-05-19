"use client";

import { useEffect, useRef, useState } from "react";
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
  const viewedShelf = useUiStore((s) => s.viewedShelf);
  const sessionCount = useUiStore((s) => s.sessionCount);
  const activeWhisper = useUiStore((s) => s.activeWhisper);
  const setActiveWhisper = useUiStore((s) => s.setActiveWhisper);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!userId || fetchedRef.current || activeWhisper) return;
    fetchedRef.current = true;

    getWhispersToday(userId).then(async (shown) => {
      if (shown.length >= 1) return;

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
  };

  return { text, show: !!text, dismiss };
}
