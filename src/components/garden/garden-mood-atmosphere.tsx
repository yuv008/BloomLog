"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { getMoodConfig } from "@/lib/mood/config";
import { cozyEase, durations } from "@/lib/motion";
import { ParticleLayer } from "@/components/mood/particle-layer";
import type { Mood } from "@/lib/types";

export function GardenMoodAtmosphere({ mood }: { mood: Mood | null }) {
  const config = getMoodConfig(mood);

  return (
    <m.div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[28px] bg-gradient-to-b",
        config.gradient
      )}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: durations.narrative, ease: cozyEase }}
      aria-hidden
    >
      <ParticleLayer mood={config} />
    </m.div>
  );
}
