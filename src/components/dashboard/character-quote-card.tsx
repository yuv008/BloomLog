"use client";

import { getDailyQuote } from "@/lib/quotes/daily-quote";

export function CharacterQuoteCard({
  dateKey,
  userId,
}: {
  dateKey: string;
  userId: string;
}) {
  const { quote, character, source } = getDailyQuote(dateKey, userId);

  return (
    <div className="glass-card p-5">
      <p className="font-display text-lg text-ink mb-3">a line to keep</p>
      <blockquote className="text-sm text-ink leading-relaxed italic">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <p className="text-xs text-whisper mt-3">
        — {character} · {source}
      </p>
    </div>
  );
}
