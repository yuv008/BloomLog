"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { Sheet } from "@/components/primitives/sheet";
import { EXPENSE_CATEGORIES } from "@/lib/finance/categories";
import { aggregateExpensesByCategory } from "@/lib/finance/monthly";
import { MonthlySpendPanel } from "@/components/finance/monthly-spend-chart";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { NumberWheel } from "./number-wheel";

export function SpendBubblesCard({
  expenses,
  monthlyExpenses,
  onAdd,
}: {
  expenses: Expense[];
  monthlyExpenses: Expense[];
  onAdd: (category: ExpenseCategory, amount: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [amount, setAmount] = useState(200);
  const [selected, setSelected] = useState<Expense | null>(null);
  const todayTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthRows = aggregateExpensesByCategory(monthlyExpenses);
  const monthTotal = monthRows.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <Card>
        <p className="font-display text-lg text-ink">where money went today</p>
        <p className="text-xs text-whisper mb-3 tabular-nums">
          ₹{todayTotal.toFixed(0)} today · no judgment
        </p>
        <m.div className="relative min-h-[140px] rounded-[20px] bg-beige/20 p-3 overflow-hidden">
          {expenses.length === 0 ? (
            <p className="text-sm text-whisper text-center py-10">tap + to log a soft spend</p>
          ) : (
            expenses.map((e, i) => {
              const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.category);
              const size = 48 + Math.min(Number(e.amount) / 20, 48);
              return (
                <m.button
                  key={e.id}
                  type="button"
                  onClick={() => setSelected(e)}
                  className="absolute rounded-full flex items-center justify-center text-lg shadow-sm"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: cat?.color ?? "#E8DCC8",
                    left: `${15 + (i * 17) % 70}%`,
                    top: `${10 + (i * 23) % 55}%`,
                  }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                >
                  {cat?.emoji}
                </m.button>
              );
            })
          )}
        </m.div>
        <Button variant="blush" className="w-full mt-4" onClick={() => setOpen(true)}>
          + log spend
        </Button>

        <div className="mt-5 pt-4 border-t border-beige/50">
          <button
            type="button"
            onClick={() => setMonthOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left rounded-[16px] px-1 py-1 -mx-1 hover:bg-beige/20 transition-colors"
            aria-expanded={monthOpen}
          >
            <div>
              <p className="font-display text-base text-ink">this month, softly</p>
              <p className="text-xs text-whisper mt-0.5">
                {monthTotal > 0
                  ? `₹${monthTotal.toFixed(0)} across ${monthRows.length} ${monthRows.length === 1 ? "place" : "places"}`
                  : "peek at your month shape"}
              </p>
            </div>
            <m.span
              animate={{ rotate: monthOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-whisper shrink-0"
            >
              <ChevronDown className="h-5 w-5" strokeWidth={1.5} />
            </m.span>
          </button>

          <AnimatePresence initial={false}>
            {monthOpen && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <MonthlySpendPanel expenses={monthlyExpenses} />
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <Sheet open={open} onOpenChange={setOpen} title="mindful spend">
        {!category ? (
          <div className="grid grid-cols-3 gap-3">
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className="flex flex-col items-center gap-2 rounded-[20px] bg-beige/40 p-4 active:scale-[0.97]"
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-xs text-ink">{c.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <NumberWheel value={amount} onChange={setAmount} />
            <Button
              className="w-full"
              onClick={async () => {
                await onAdd(category, amount);
                setOpen(false);
                setCategory(null);
                setAmount(200);
              }}
            >
              save gently
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)} title="polaroid">
        {selected && (
          <div className="rounded-[20px] bg-cream p-4 border border-beige rotate-[-1deg]">
            <p className="font-display text-xl">
              {EXPENSE_CATEGORIES.find((c) => c.id === selected.category)?.emoji}{" "}
              ₹{Number(selected.amount).toFixed(0)}
            </p>
            <p className="text-sm text-whisper mt-2">
              {EXPENSE_CATEGORIES.find((c) => c.id === selected.category)?.label}
            </p>
            {selected.note && <p className="text-sm text-ink mt-2">{selected.note}</p>}
          </div>
        )}
      </Sheet>
    </>
  );
}
