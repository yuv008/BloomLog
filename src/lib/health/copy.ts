export const HEALTH_DISCLAIMER =
  "Nutrition numbers are gentle estimates, not medical advice.";

export const ENCOURAGEMENTS = [
  "you're nourishing yourself with care today",
  "small bites of awareness add up softly",
  "your kitchen remembers every gentle log",
  "listening to your body is already a win",
  "cozy fuel beats perfect tracking",
];

export function pickEncouragement(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % ENCOURAGEMENTS.length;
  return ENCOURAGEMENTS[h]!;
}

export function calorieFrame(pct: number): string {
  if (pct <= 0) return "your plate is open for gentle fuel";
  if (pct < 50) return "a soft start — room to grow";
  if (pct < 90) return "balanced and cared for";
  if (pct <= 110) return "full and cared for";
  return "nourished beyond the guide — that's okay";
}
