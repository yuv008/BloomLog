"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import type { MemoryPolaroid } from "@/lib/types";
import { useUiStore } from "@/stores/use-ui-store";

export function MemoryShelf({ polaroids }: { polaroids: MemoryPolaroid[] }) {
  const [flipped, setFlipped] = useState<string | null>(null);
  const setViewedShelf = useUiStore((s) => s.setViewedShelf);

  useEffect(() => {
    setViewedShelf(true);
  }, [setViewedShelf]);

  if (polaroids.length === 0) {
    return (
      <div className="glass-card p-8 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <p className="font-display text-xl text-ink">memory shelf</p>
        <p className="text-sm text-whisper mt-2 max-w-xs">
          polaroids appear at week&apos;s end — cozy weeks, soft sleep, gentle spends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <p className="font-display text-2xl text-ink px-2">memory shelf</p>
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 pb-8">
        {polaroids.map((p, i) => (
          <m.button
            key={p.id}
            type="button"
            onClick={() => setFlipped(flipped === p.id ? null : p.id)}
            className="shrink-0 w-56"
            style={{ rotate: i % 2 === 0 ? -2 : 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <AnimatePresence mode="wait">
              <m.div
                key={flipped === p.id ? "back" : "front"}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                className="rounded-[12px] bg-cream border-4 border-white shadow-lg p-4 min-h-[200px]"
              >
                {flipped === p.id ? (
                  <div className="text-sm text-ink space-y-2">
                    <p className="font-display text-lg">
                      {(p.payload as { label?: string }).label ?? p.kind}
                    </p>
                    <p className="text-whisper text-xs">
                      {p.period_start} — {p.period_end}
                    </p>
                    <pre className="text-xs text-whisper whitespace-pre-wrap">
                      {JSON.stringify(p.payload, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <p className="font-display text-lg text-ink">
                      {(p.payload as { label?: string }).label ?? p.kind.replace("_", " ")}
                    </p>
                    <p className="text-4xl mt-8 text-center">
                      {p.kind === "cozy_week" ? "🪟" : p.kind === "soft_sleep" ? "🌙" : "🌸"}
                    </p>
                  </div>
                )}
              </m.div>
            </AnimatePresence>
          </m.button>
        ))}
      </div>
    </div>
  );
}
