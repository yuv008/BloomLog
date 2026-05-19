"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { useUserPreferences } from "@/components/providers/user-preferences";
import { Button } from "@/components/primitives/button";
import { Sheet } from "@/components/primitives/sheet";
import { getMoodConfig } from "@/lib/mood/config";
import * as api from "@/lib/data/api";
import { trackEvent } from "@/lib/analytics/posthog";
import type { JournalLetter } from "@/lib/types";

function excerpt(body: string, max = 120) {
  const t = body.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function formatLetterDate(iso: string, timeZone: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function JournalLetters({
  userId,
  letters,
  onChanged,
}: {
  userId: string;
  letters: JournalLetter[];
  onChanged: () => void;
}) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [readLetter, setReadLetter] = useState<JournalLetter | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const { timezone } = useUserPreferences();

  const saveNew = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await api.addJournalLetter(userId, draft);
      trackEvent("journal_written");
      setDraft("");
      setComposeOpen(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const deleteLetter = async (letter: JournalLetter) => {
    if (!confirm("let this letter go? it cannot be undone.")) return;
    await api.deleteJournalLetter(userId, letter.id);
    setReadLetter(null);
    onChanged();
  };

  return (
    <section className="mt-10 pt-8 border-t border-beige/50">
      <m.div
        className="flex items-start justify-between gap-4 mb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="font-display text-2xl text-ink">letters to yourself</h2>
          <p className="text-sm text-whisper mt-1">
            write when you have more than a line. no schedule.
          </p>
        </div>
        <Button size="sm" variant="blush" onClick={() => setComposeOpen(true)}>
          + new letter
        </Button>
      </m.div>

      {letters.length === 0 ? (
        <div className="glass-card p-8 text-center rounded-[20px]">
          <p className="text-4xl mb-3" aria-hidden>
            ✉️
          </p>
          <p className="font-display text-lg text-ink">your shelf has room for a letter</p>
          <p className="text-sm text-whisper mt-2 max-w-xs mx-auto">
            longer thoughts belong here — no schedule, no pressure.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {letters.map((letter, i) => {
            const mood = letter.mood_snapshot
              ? getMoodConfig(letter.mood_snapshot)
              : null;
            return (
              <m.li
                key={letter.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  type="button"
                  onClick={() => setReadLetter(letter)}
                  className="w-full text-left rounded-[12px] bg-cream border-4 border-white shadow-md p-4 min-h-[100px] hover:shadow-lg transition-shadow"
                  style={{ rotate: i % 2 === 0 ? "-1deg" : "1deg" }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-whisper">
                      {formatLetterDate(letter.created_at, timezone)}
                    </span>
                    {mood && (
                      <span className="text-lg" title={mood.label}>
                        {mood.emoji}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink line-clamp-3 whitespace-pre-wrap">
                    {excerpt(letter.body)}
                  </p>
                </button>
              </m.li>
            );
          })}
        </ul>
      )}

      <Sheet open={composeOpen} onOpenChange={setComposeOpen} title="a new letter">
        <div className="space-y-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="dear you, today felt like…"
            rows={8}
            className="w-full rounded-[20px] border border-beige bg-cream/80 px-4 py-3 text-sm text-ink placeholder:text-whisper resize-none focus:outline-none focus:ring-1 focus:ring-sage"
            autoFocus
          />
          <Button
            className="w-full"
            disabled={!draft.trim() || saving}
            onClick={saveNew}
          >
            {saving ? "folding it gently…" : "save gently"}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={!!readLetter}
        onOpenChange={(open) => !open && setReadLetter(null)}
        title="your letter"
      >
        {readLetter && (
          <div className="space-y-4">
            <p className="text-xs text-whisper">{formatLetterDate(readLetter.created_at, timezone)}</p>
            {readLetter.mood_snapshot && (
              <p className="text-sm text-whisper">
                sky that day:{" "}
                {getMoodConfig(readLetter.mood_snapshot)?.emoji}{" "}
                {getMoodConfig(readLetter.mood_snapshot)?.label}
              </p>
            )}
            <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
              {readLetter.body}
            </p>
            <Button
              variant="ghost"
              className="w-full text-whisper"
              onClick={() => deleteLetter(readLetter)}
            >
              let this letter go
            </Button>
          </div>
        )}
      </Sheet>
    </section>
  );
}
