import type { Mood } from "@/lib/types";

export interface MoodConfig {
  id: Mood;
  label: string;
  emoji: string;
  gradient: string;
  particle: "flare" | "dust" | "stars" | "rain" | "moon" | "petals" | "lightning";
}

export const MOODS: MoodConfig[] = [
  {
    id: "sunny",
    label: "Sunny",
    emoji: "☀️",
    gradient: "from-amber-100 via-orange-50 to-cream",
    particle: "flare",
  },
  {
    id: "cozy",
    label: "Cozy",
    emoji: "🪟",
    gradient: "from-amber-50 via-beige to-cream",
    particle: "dust",
  },
  {
    id: "dreamy",
    label: "Dreamy",
    emoji: "✨",
    gradient: "from-lavender-100 via-mint-50 to-cream",
    particle: "stars",
  },
  {
    id: "rainy",
    label: "Rainy",
    emoji: "🌧️",
    gradient: "from-slate-200 via-sage-100 to-cream",
    particle: "rain",
  },
  {
    id: "sleepy",
    label: "Sleepy",
    emoji: "🌙",
    gradient: "from-plum-100 via-purple-50 to-cream",
    particle: "moon",
  },
  {
    id: "golden_hour",
    label: "Golden Hour",
    emoji: "🌅",
    gradient: "from-peach-100 via-rose-50 to-cream",
    particle: "petals",
  },
  {
    id: "stormy",
    label: "Stormy",
    emoji: "⛈️",
    gradient: "from-teal-200 via-gray-200 to-cream",
    particle: "lightning",
  },
];

export function getMoodConfig(mood: Mood | null): MoodConfig {
  return MOODS.find((m) => m.id === mood) ?? MOODS[1];
}
