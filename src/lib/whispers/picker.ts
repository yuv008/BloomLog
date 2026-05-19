import type { Mood } from "@/lib/types";
import { WHISPER_LIBRARY, type WhisperEntry } from "./library";

export interface WhisperContext {
  mood: Mood | null;
  waterMl: number;
  questsCompletedToday: number;
  viewedShelf: boolean;
  shownTodayKeys: string[];
  sessionCount: number;
}

function dayOfWeek(): number {
  return new Date().getDay();
}

export function pickWhisper(ctx: WhisperContext): WhisperEntry | null {
  if (ctx.shownTodayKeys.length >= 1) return null;
  if (ctx.sessionCount % 4 !== 0 && ctx.sessionCount > 1) return null;

  let candidates = WHISPER_LIBRARY.filter(
    (w) => !ctx.shownTodayKeys.includes(w.key)
  );

  if (ctx.mood === "stormy") {
    const stormy = candidates.filter((w) => w.trigger === "stormy");
    if (stormy.length) candidates = stormy;
  } else if (ctx.mood === "rainy") {
    const rainy = candidates.filter((w) => w.trigger === "rainy");
    if (rainy.length) candidates = rainy;
  } else if (ctx.waterMl < 500) {
    const water = candidates.filter((w) => w.trigger === "low_water");
    if (water.length) candidates = water;
  } else if (dayOfWeek() === 1) {
    const monday = candidates.filter((w) => w.trigger === "monday");
    if (monday.length) candidates = monday;
  } else if (ctx.viewedShelf) {
    const shelf = candidates.filter((w) => w.trigger === "shelf");
    if (shelf.length) candidates = shelf;
  } else if (ctx.questsCompletedToday >= 2) {
    const quest = candidates.filter((w) => w.trigger === "quest_streak");
    if (quest.length) candidates = quest;
  }

  const pool = candidates.length ? candidates : WHISPER_LIBRARY;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? null;
}
