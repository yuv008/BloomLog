"use client";

import { useState, useRef } from "react";
import { m } from "framer-motion";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { Sheet } from "@/components/primitives/sheet";
import { waterSpring } from "@/lib/motion";
import { useUiStore } from "@/stores/use-ui-store";

const GOAL_ML = 2000;
const TAP_ML = 250;

export function WaterBottleCard({
  waterMl,
  onAdd,
}: {
  waterMl: number;
  onAdd: (ml: number) => Promise<void>;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customMl, setCustomMl] = useState(500);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerPetal = useUiStore((s) => s.triggerPetalBurst);
  const pct = Math.min((waterMl / GOAL_ML) * 100, 120);

  const handleTap = async () => {
    await onAdd(TAP_ML);
    if (waterMl + TAP_ML >= GOAL_ML && waterMl < GOAL_ML) {
      triggerPetal();
    }
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const handlePointerDown = () => {
    holdTimer.current = setTimeout(() => setSheetOpen(true), 500);
  };

  const handlePointerUp = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  return (
  <>
    <Card>
      <p className="font-display text-lg text-ink mb-1">your bottle</p>
      <p className="text-xs text-whisper mb-4">tap +250ml · hold for custom</p>
      <div
        className="flex items-center gap-6"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <m.div
          className="relative h-40 w-16 rounded-[28px] border border-beige/80 bg-cream/50 overflow-hidden"
          animate={pct >= 50 ? { boxShadow: "0 0 24px rgba(168,184,154,0.35)" } : {}}
        >
          <m.div
            className="absolute bottom-0 left-0 right-0 bg-sage/50"
            initial={false}
            animate={{ height: `${Math.min(pct, 100)}%` }}
            transition={waterSpring}
          />
          <div
            className="absolute left-0 right-0 border-t border-sage/30"
            style={{ bottom: `${Math.min(pct, 100)}%` }}
          />
          <div
            className="absolute w-full border-t border-dashed border-whisper/20"
            style={{ bottom: "100%" }}
          />
        </m.div>
        <div className="flex-1 space-y-3">
          <p className="text-sm text-whisper tabular-nums">
            {waterMl}ml · {Math.round(waterMl / TAP_ML)} glasses
          </p>
          <Button onClick={handleTap} className="w-full">
            +250ml
          </Button>
          {waterMl >= GOAL_ML && (
            <p className="text-sm text-sage font-display">a full bottle. soft win.</p>
          )}
          {waterMl > GOAL_ML && (
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
        <Button
          className="w-full"
          onClick={async () => {
            await onAdd(customMl);
            setSheetOpen(false);
          }}
        >
          add water
        </Button>
      </div>
    </Sheet>
  </>
  );
}
