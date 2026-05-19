"use client";

import { m } from "framer-motion";
import { Card } from "@/components/primitives/card";
import { aggregateExpensesByCategory } from "@/lib/finance/monthly";
import { monthLabel } from "@/lib/dates";
import type { Expense } from "@/lib/types";

function DonutChart({
  slices,
  total,
}: {
  slices: { amount: number; color: string }[];
  total: number;
}) {
  if (total <= 0) {
    return (
      <m.div
        className="relative h-36 w-36 rounded-full bg-beige/40 border border-beige/80 flex items-center justify-center"
        aria-hidden
      >
        <span className="text-2xl opacity-40">○</span>
      </m.div>
    );
  }

  let cumulative = 0;
  const gradient = slices
    .map((s) => {
      const start = (cumulative / total) * 100;
      cumulative += s.amount;
      const end = (cumulative / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <m.div
      className="relative h-36 w-36 rounded-full shrink-0 shadow-sm"
      style={{ background: `conic-gradient(${gradient})` }}
      role="img"
      aria-label={`spending breakdown, ${slices.length} categories`}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <m.div className="absolute inset-[22%] rounded-full bg-cream flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-wide text-whisper">month</span>
        <span className="font-display text-lg text-ink tabular-nums">₹{total.toFixed(0)}</span>
      </m.div>
    </m.div>
  );
}

export function MonthlySpendChart({ expenses }: { expenses: Expense[] }) {
  const month = monthLabel();
  const rows = aggregateExpensesByCategory(expenses);
  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <Card>
      <p className="font-display text-lg text-ink">this month, softly</p>
      <p className="text-xs text-whisper mb-4">{month} · no judgment, just shape</p>

      {total === 0 ? (
        <p className="text-sm text-whisper text-center py-8 rounded-[20px] bg-beige/20">
          log a spend on today — your gentle pie will grow here.
        </p>
      ) : (
        <m.div
          className="flex flex-col sm:flex-row items-center gap-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <DonutChart slices={rows} total={total} />
          <ul className="flex-1 w-full space-y-2">
            {rows.map((row) => {
              const pct = Math.round((row.amount / total) * 100);
              return (
                <li key={row.category} className="flex items-center gap-3 text-sm">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="text-lg leading-none">{row.emoji}</span>
                  <span className="flex-1 text-ink">{row.label}</span>
                  <span className="text-whisper tabular-nums">{pct}%</span>
                  <span className="text-ink tabular-nums w-14 text-right">
                    ₹{row.amount.toFixed(0)}
                  </span>
                </li>
              );
            })}
          </ul>
        </m.div>
      )}
    </Card>
  );
}
