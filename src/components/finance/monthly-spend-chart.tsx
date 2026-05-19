"use client";

import { m } from "framer-motion";
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
      <div
        className="relative h-28 w-28 rounded-full bg-beige/30 border border-beige/60 flex items-center justify-center shrink-0"
        aria-hidden
      >
        <span className="text-xl opacity-40">○</span>
      </div>
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
      className="relative h-28 w-28 rounded-full shrink-0"
      style={{ background: `conic-gradient(${gradient})` }}
      role="img"
      aria-label={`spending breakdown, ${slices.length} categories`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      <div className="absolute inset-[22%] rounded-full bg-cream flex flex-col items-center justify-center">
        <span className="text-[9px] uppercase tracking-wide text-whisper">month</span>
        <span className="font-display text-base text-ink tabular-nums">₹{total.toFixed(0)}</span>
      </div>
    </m.div>
  );
}

export function MonthlySpendPanel({ expenses }: { expenses: Expense[] }) {
  const month = monthLabel();
  const rows = aggregateExpensesByCategory(expenses);
  const total = rows.reduce((s, r) => s + r.amount, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-whisper text-center py-4 px-2">
        when you log spends, a gentle month shape will appear here.
      </p>
    );
  }

  return (
    <m.div
      className="flex flex-col items-center gap-4 pt-1"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <p className="text-xs text-whisper w-full text-center">{month}</p>
      <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
        <DonutChart slices={rows} total={total} />
        <ul className="flex-1 w-full space-y-1.5">
          {rows.map((row) => {
            const pct = Math.round((row.amount / total) * 100);
            return (
              <li key={row.category} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: row.color }}
                />
                <span className="text-base leading-none">{row.emoji}</span>
                <span className="flex-1 text-ink">{row.label}</span>
                <span className="text-whisper tabular-nums text-xs">{pct}%</span>
                <span className="text-ink tabular-nums text-xs w-12 text-right">
                  ₹{row.amount.toFixed(0)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </m.div>
  );
}
