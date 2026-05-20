"use client";

import { useCallback, useEffect, useState } from "react";
import { m } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useUserPreferences } from "@/components/providers/user-preferences";
import { formatMoney } from "@/lib/locale/format-money";
import { cn } from "@/lib/utils";

const QUICK_CHIPS = [1, 2, 5, 10, 20, 50] as const;

function clampAmount(n: number) {
  return Math.min(99_999, Math.max(0.01, Math.round(n * 100) / 100));
}

function stepFor(value: number) {
  if (value < 20) return 1;
  if (value < 100) return 5;
  return 10;
}

function hapticPulse() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(8);
  }
}

export function AmountInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const { currency } = useUserPreferences();
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");
  const [showFineTune, setShowFineTune] = useState(false);
  const [sliderValue, setSliderValue] = useState(value);

  useEffect(() => {
    setSliderValue(value);
  }, [value]);

  const setAmount = useCallback(
    (n: number) => {
      const next = clampAmount(n);
      onChange(next);
      setSliderValue(next);
      hapticPulse();
    },
    [onChange]
  );

  const bump = (delta: number) => setAmount(value + delta);

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      <m.p
        key={value}
        initial={{ opacity: 0.6, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-display text-3xl text-ink tabular-nums"
      >
        {formatMoney(value, currency)}
      </m.p>

      <div className="w-full max-w-full min-w-0 overflow-x-auto no-scrollbar py-1 snap-x">
        <div className="flex gap-2 w-max min-w-full px-0.5">
          {QUICK_CHIPS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setCustomMode(false);
                setAmount(n);
              }}
              className={cn(
                "snap-center shrink-0 min-h-[44px] rounded-[20px] px-4 py-3 text-sm font-medium transition-colors active:scale-[0.97]",
                value === n && !customMode
                  ? "bg-sage text-cream"
                  : "bg-beige/50 text-ink"
              )}
            >
              {formatMoney(n, currency)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCustomMode(true);
              setCustomText(String(value));
              hapticPulse();
            }}
            className={cn(
              "snap-center shrink-0 min-h-[44px] rounded-[20px] px-4 py-3 text-sm transition-colors active:scale-[0.97]",
              customMode ? "bg-sage text-cream" : "bg-beige/50 text-ink"
            )}
          >
            custom
          </button>
        </div>
      </div>

      {customMode && (
        <input
          type="text"
          inputMode="decimal"
          value={customText}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.]/g, "");
            setCustomText(raw);
            const parsed = parseFloat(raw);
            if (!Number.isNaN(parsed) && parsed > 0) {
              onChange(clampAmount(parsed));
              setSliderValue(clampAmount(parsed));
            }
          }}
          placeholder="enter amount"
          className="w-full min-h-[48px] rounded-[20px] border border-beige bg-cream/80 px-4 text-center text-xl text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-sage/40"
          aria-label="Custom amount"
        />
      )}

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => bump(-stepFor(value))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-beige/50 text-ink active:scale-95"
          aria-label="Decrease amount"
        >
          <Minus className="h-5 w-5" strokeWidth={2} />
        </button>
        <span className="text-xs text-whisper min-w-[4rem] text-center tabular-nums" aria-live="polite">
          {formatMoney(value, currency)}
        </span>
        <button
          type="button"
          onClick={() => bump(stepFor(value))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-beige/50 text-ink active:scale-95"
          aria-label="Increase amount"
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowFineTune((v) => !v)}
        className="w-full text-center text-xs text-whisper underline-offset-2 hover:underline"
      >
        {showFineTune ? "hide fine tune" : "fine tune with slider"}
      </button>

      {showFineTune && (
        <input
          type="range"
          min={1}
          max={500}
          step={1}
          value={Math.min(500, Math.max(1, sliderValue))}
          onChange={(e) => {
            const n = Number(e.target.value);
            setSliderValue(n);
          }}
          onPointerUp={() => setAmount(sliderValue)}
          onTouchEnd={() => setAmount(sliderValue)}
          className="w-full accent-sage touch-none"
          style={{ touchAction: "none" }}
          aria-valuemin={1}
          aria-valuemax={500}
          aria-valuenow={sliderValue}
          aria-label="Fine tune amount"
        />
      )}
    </div>
  );
}
