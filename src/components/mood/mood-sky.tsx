"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { MOODS, getMoodConfig } from "@/lib/mood/config";
import type { Mood } from "@/lib/types";
import { ParticleLayer } from "./particle-layer";
import { cozyEase, durations } from "@/lib/motion";

export function MoodSkyBackground({ mood }: { mood: Mood | null }) {
  const config = getMoodConfig(mood);
  return (
    <m.div
      layoutId="mood-sky-bg"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b transition-colors",
        config.gradient
      )}
      transition={{ duration: durations.narrative, ease: cozyEase }}
    >
      <ParticleLayer mood={config} />
    </m.div>
  );
}

export function MoodCarousel({
  value,
  onChange,
}: {
  value: Mood | null;
  onChange: (mood: Mood) => void;
}) {
  return (
    <m.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="font-display text-lg text-ink mb-3">what&apos;s the weather inside?</p>
      <div
        className="flex gap-3 overflow-x-auto no-scrollbar pb-1"
      >
        {MOODS.map((mood) => (
          <m.button
            key={mood.id}
            type="button"
            layoutId={value === mood.id ? "mood-orb-active" : undefined}
            onClick={() => onChange(mood.id)}
            whileTap={{ scale: 0.97, opacity: 0.9 }}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1 rounded-[28px] px-3 py-2 transition-colors",
              value === mood.id ? "bg-blush/40 ring-1 ring-blush/60" : "bg-beige/30"
            )}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-xs text-whisper">{mood.label}</span>
          </m.button>
        ))}
      </div>
    </m.div>
  );
}

