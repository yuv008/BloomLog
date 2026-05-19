"use client";

import { useRef } from "react";

const PRESETS = [50, 100, 200, 500, 1000, 2000, 5000];

export function NumberWheel({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      <p className="text-center font-display text-3xl text-ink tabular-nums">₹{value}</p>
      <div
        ref={ref}
        className="flex gap-2 overflow-x-auto no-scrollbar py-2 snap-x"
      >
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`snap-center shrink-0 rounded-[20px] px-5 py-3 text-sm transition-colors ${
              value === n ? "bg-sage text-cream" : "bg-beige/50 text-ink"
            }`}
          >
            ₹{n}
          </button>
        ))}
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
