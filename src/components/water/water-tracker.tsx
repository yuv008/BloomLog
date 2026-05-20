"use client";

import { useState, useRef } from "react";
import { m } from "framer-motion";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { Sheet } from "@/components/primitives/sheet";
import { waterSpring } from "@/lib/motion";
import { useUiStore } from "@/stores/use-ui-store";
import { cn } from "@/lib/utils";

const DEFAULT_TAP_ML = 250;

function BottleFill({
  waterMl,
  goalMl,
  size,
}: {
  waterMl: number;
  goalMl: number;
  size: "hero" | "compact";
}) {
  const pct = goalMl > 0 ? Math.min((waterMl / goalMl) * 100, 120) : 0;
  const fillPct = Math.min(pct, 100);

  return (
    <m.div
      className={cn(
        "relative rounded-[20px] border border-beige/80 bg-cream/50 overflow-hidden shrink-0",
        size === "hero" ? "h-40 w-16 rounded-[28px]" : "h-24 w-12"
      )}
      animate={size === "hero" && pct >= 50 ? { boxShadow: "0 0 24px rgba(168,184,154,0.35)" } : {}}
    >
      <m.div
        className="absolute bottom-0 left-0 right-0 bg-sage/50"
        initial={false}
        animate={{ height: `${fillPct}%` }}
        transition={waterSpring}
      />
      {size === "hero" && (
        <>
          <div
            className="absolute left-0 right-0 border-t border-sage/30"
            style={{ bottom: `${fillPct}%` }}
          />
          <div
            className="absolute w-full border-t border-dashed border-whisper/20"
            style={{ bottom: "100%" }}
          />
        </>
      )}
    </m.div>
  );
}

export type WaterTrackerProps = {
  variant: "hero" | "compact";
  waterMl: number;
  goalMl: number;
  onAdd: (ml: number) => Promise<void>;
  streak?: number;
  tapMl?: number;
};

export function WaterTracker({
  variant,
  waterMl,
  goalMl,
  onAdd,
  streak = 0,
  tapMl = DEFAULT_TAP_ML,
}: WaterTrackerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customMl, setCustomMl] = useState(500);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerPetal = useUiStore((s) => s.triggerPetalBurst);

  const maybeCelebrate = (addedMl: number) => {
    if (waterMl + addedMl >= goalMl && waterMl < goalMl) {
      triggerPetal();
    }
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const handleTap = async () => {
    await onAdd(tapMl);
    maybeCelebrate(tapMl);
  };

  const handleCustomAdd = async (ml: number) => {
    await onAdd(ml);
    maybeCelebrate(ml);
    setSheetOpen(false);
  };

  const handlePointerDown = () => {
    if (variant !== "hero") return;
    holdTimer.current = setTimeout(() => setSheetOpen(true), 500);
  };

  const handlePointerUp = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-4 rounded-[20px] border border-beige/50 bg-cream/50 p-4">
        <BottleFill waterMl={waterMl} goalMl={goalMl} size="compact" />
        <div className="flex-1 min-w-0">
          <p className="font-display text-ink">hydration</p>
          <p className="text-xs text-whisper tabular-nums">
            {waterMl}ml · goal {goalMl}ml
          </p>
          {streak > 0 && (
            <p className="text-xs text-sage mt-1">{streak} day gentle streak</p>
          )}
          <Button variant="ghost" className="mt-2 h-8 text-xs" onClick={handleTap}>
            + sip {tapMl}ml
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <p className="font-display text-lg text-ink mb-1">your bottle</p>
        <p className="text-xs text-whisper mb-4">
          tap +{tapMl}ml · hold for custom
        </p>
        <div
          className="flex items-center gap-6"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <BottleFill waterMl={waterMl} goalMl={goalMl} size="hero" />
          <div className="flex-1 space-y-3 min-w-0">
            <p className="text-sm text-whisper tabular-nums">
              {waterMl}ml · {Math.round(waterMl / tapMl)} glasses
            </p>
            <Button onClick={handleTap} className="w-full">
              +{tapMl}ml
            </Button>
            {waterMl >= goalMl && (
              <p className="text-sm text-sage font-display">a full bottle. soft win.</p>
            )}
            {waterMl > goalMl && (
              <p className="text-xs text-whisper">bubbles floating up. no warning needed.</p>
            )}
          </div>
        </div>
      </Card>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="custom amount">
        <div className="space-y-4">
          <input
            type="range"
            min={50}
            max={1000}
            step={50}
            value={customMl}
            onChange={(e) => setCustomMl(Number(e.target.value))}
            className="w-full accent-sage"
          />
          <p className="text-center text-ink tabular-nums">{customMl}ml</p>
          <Button className="w-full" onClick={() => handleCustomAdd(customMl)}>
            add water
          </Button>
        </div>
      </Sheet>
    </>
  );
}
