import type { CalendarCategory } from "@/lib/types";

export const CALENDAR_CATEGORIES: {
  id: CalendarCategory;
  label: string;
  emoji: string;
  dotClass: string;
}[] = [
  { id: "nourish", label: "nourish", emoji: "🥗", dotClass: "bg-sage/70" },
  { id: "move", label: "move", emoji: "🚶", dotClass: "bg-sage/50" },
  { id: "rest", label: "rest", emoji: "🌙", dotClass: "bg-lavender/40" },
  { id: "care", label: "care", emoji: "✨", dotClass: "bg-blush/60" },
  { id: "study", label: "study", emoji: "📖", dotClass: "bg-beige/80" },
  { id: "social", label: "social", emoji: "💬", dotClass: "bg-blush/40" },
  { id: "home", label: "home", emoji: "🏠", dotClass: "bg-beige/60" },
  { id: "ritual", label: "ritual", emoji: "🌿", dotClass: "bg-sage/80" },
  { id: "other", label: "other", emoji: "·", dotClass: "bg-whisper/30" },
];

export const PRIORITY_LABELS: Record<number, string> = {
  1: "gentle focus",
  2: "soon",
  3: "when you can",
};

export function categoryMeta(id: CalendarCategory) {
  return CALENDAR_CATEGORIES.find((c) => c.id === id) ?? CALENDAR_CATEGORIES[CALENDAR_CATEGORIES.length - 1];
}
