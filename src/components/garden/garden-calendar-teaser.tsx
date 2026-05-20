"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { useCalendarAgenda } from "@/hooks/use-calendar";
import { useTodayKey } from "@/hooks/use-bloom-data";

export function GardenCalendarTeaser({ userId }: { userId: string }) {
  const { date } = useTodayKey();
  const { data: items = [] } = useCalendarAgenda(userId, date);
  const open = items.filter((i) => i.status === "open").length;

  return (
    <Link
      href="/calendar"
      className="mb-4 flex items-center gap-3 rounded-2xl border border-beige/30 bg-cream/40 px-4 py-3 text-sm transition-colors hover:border-sage/30"
    >
      <Calendar className="h-4 w-4 text-sage" strokeWidth={1.5} />
      <span className="text-ink">
        {open > 0
          ? `${open} gentle plan${open === 1 ? "" : "s"} today`
          : "plan your day on the calendar"}
      </span>
      <span className="ml-auto text-xs text-sage">calendar →</span>
    </Link>
  );
}
