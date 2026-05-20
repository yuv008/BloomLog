"use client";

import { m } from "framer-motion";
import { waterSpring } from "@/lib/motion";
import { Button } from "@/components/primitives/button";

export function HydrationVignette({
  waterMl,
  goalMl,
  streak,
  onAdd,
}: {
  waterMl: number;
  goalMl: number;
  streak: number;
  onAdd: (ml: number) => Promise<void>;
}) {
  const pct = Math.min((waterMl / goalMl) * 100, 100);

  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-beige/50 bg-cream/50 p-4">
      <div className="relative h-24 w-12 rounded-[20px] border border-beige/80 overflow-hidden shrink-0">
        <m.div
          className="absolute bottom-0 left-0 right-0 bg-sage/45"
          initial={false}
          animate={{ height: `${pct}%` }}
          transition={waterSpring}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-ink">hydration</p>
        <p className="text-xs text-whisper">
          {waterMl}ml · goal {goalMl}ml
        </p>
        {streak > 0 && (
          <p className="text-xs text-sage mt-1">{streak} day gentle streak</p>
        )}
        <Button variant="ghost" className="mt-2 h-8 text-xs" onClick={() => onAdd(250)}>
          + sip 250ml
        </Button>
      </div>
    </div>
  );
}
