"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { MEAL_SLOTS } from "@/lib/health/slots";
import type { FoodLogEntry, MealSlot } from "@/lib/types";

export function MealSlotTimeline({ entries }: { entries: FoodLogEntry[] }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <div className="flex gap-3 min-w-min">
        {MEAL_SLOTS.map((slot) => {
          const slotEntries = entries.filter((e) => e.meal_slot === slot.id);
          const latest = slotEntries[slotEntries.length - 1];
          return (
            <Link
              key={slot.id}
              href={`/nourish/log?slot=${slot.id}`}
              className={`shrink-0 w-28 rounded-[16px] p-3 border border-beige/50 ${slot.color}`}
            >
              <span className="text-xl">{slot.emoji}</span>
              <p className="text-xs text-ink capitalize mt-1">{slot.label}</p>
              {latest ? (
                <m.p
                  layout
                  className="text-[10px] text-whisper truncate mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {latest.name}
                </m.p>
              ) : (
                <p className="text-[10px] text-whisper mt-1">+ add</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function slotFromParam(param: string | null): MealSlot {
  const valid = MEAL_SLOTS.map((s) => s.id);
  if (param && valid.includes(param as MealSlot)) return param as MealSlot;
  return "snack";
}
