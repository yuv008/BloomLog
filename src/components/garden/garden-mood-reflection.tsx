"use client";

import Link from "next/link";
import { getMoodConfig } from "@/lib/mood/config";
import type { Mood } from "@/lib/types";

export function GardenMoodReflection({ mood }: { mood: Mood | null }) {
  const config = getMoodConfig(mood);
  const hasMood = mood !== null;

  return (
    <div className="glass-card mb-4 flex min-w-0 max-w-full items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-xs text-whisper">what&apos;s the weather inside?</p>
        {hasMood ? (
          <p className="mt-1 text-sm text-ink truncate">
            <span className="mr-1.5" aria-hidden>
              {config.emoji}
            </span>
            {config.label.toLowerCase()} inside today
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink">not set yet</p>
        )}
      </div>
      <Link
        href="/dashboard"
        className="shrink-0 text-xs text-sage whitespace-nowrap"
      >
        {hasMood ? "change on Today →" : "set on Today →"}
      </Link>
    </div>
  );
}
