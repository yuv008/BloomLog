"use client";

import { useRef } from "react";
import { useUserPreferences } from "@/components/providers/user-preferences";
import { formatMoney } from "@/lib/locale/format-money";

const PRESETS = [50, 100, 200, 500, 1000, 2000, 5000];

export function NumberWheel({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { currency } = useUserPreferences();

  return (
    <div className="space-y-3 min-w-0 max-w-full">
      <p className="text-center font-display text-3xl text-ink tabular-nums">
        {formatMoney(value, currency)}
      </p>
      <div
        ref={ref}
        className="w-full max-w-full min-w-0 overflow-x-auto no-scrollbar py-2 snap-x"
      >
        <div className="flex gap-2 w-max min-w-full">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`snap-center shrink-0 rounded-[20px] px-5 py-3 text-sm transition-colors ${
                value === n ? "bg-sage text-cream" : "bg-beige/50 text-ink"
              }`}
            >
              {formatMoney(n, currency)}
            </button>
          ))}
        </div>
      </div>
      <input
        type="range"
        min={10}
        max={10000}
        step={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sage"
      />
    </div>
  );
}
