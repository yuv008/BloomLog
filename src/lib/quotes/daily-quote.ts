import { FEMALE_CHARACTER_QUOTES, type QuoteEntry } from "@/lib/quotes/female-characters";

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getDailyQuote(dateKey: string, userId: string): QuoteEntry {
  const index = hashString(`${dateKey}:${userId}`) % FEMALE_CHARACTER_QUOTES.length;
  return FEMALE_CHARACTER_QUOTES[index]!;
}
