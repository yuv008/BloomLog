"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/primitives/button";
import { todayKey } from "@/lib/dates";
import { useUserPreferences } from "@/components/providers/user-preferences";
import { shouldUseSupabase } from "@/lib/data/auth";
import {
  getRoutineTemplates,
  createRoutineTemplate,
} from "@/lib/data/calendar-client";

export function RoutineList({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { timezone } = useUserPreferences();
  const [title, setTitle] = useState("");
  const [defaultTime, setDefaultTime] = useState("");
  const [timed, setTimed] = useState(false);
  const { data: routines = [] } = useQuery({
    queryKey: ["calendarRoutines", userId],
    queryFn: async () => {
      if (shouldUseSupabase(userId)) {
        const res = await fetch("/api/calendar/routines");
        const json = (await res.json()) as { routines: Awaited<ReturnType<typeof getRoutineTemplates>> };
        return json.routines ?? [];
      }
      return getRoutineTemplates(userId);
    },
    enabled: !!userId,
  });

  async function add() {
    if (!title.trim()) return;
    if (shouldUseSupabase(userId)) {
      await fetch("/api/calendar/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          default_time: timed && defaultTime ? defaultTime : null,
        }),
      });
    } else {
      await createRoutineTemplate(userId, {
        title: title.trim(),
        default_time: timed && defaultTime ? defaultTime : null,
      });
    }
    setTitle("");
    setDefaultTime("");
    setTimed(false);
    qc.invalidateQueries({ queryKey: ["calendarRoutines", userId] });
  }

  return (
    <section className="glass-card p-5 space-y-3">
      <h2 className="text-sm text-whisper">gentle routines</h2>
      <p className="text-xs text-whisper">
        templates for recurring rituals — spawn from calendar
      </p>
      <ul className="space-y-2">
        {routines.map((r) => (
          <li key={r.id} className="flex items-center gap-2 text-sm text-ink">
            <span>{r.emoji}</span>
            <span className="flex-1">{r.title}</span>
            {r.default_time && (
              <span className="text-xs text-whisper">
                {r.default_time.slice(0, 5)}
              </span>
            )}
          </li>
        ))}
        {routines.length === 0 && (
          <li className="text-xs text-whisper">no routines yet</li>
        )}
      </ul>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-beige/50 bg-cream/50 px-3 py-2 text-sm"
          placeholder="e.g. morning stretch"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button variant="ghost" onClick={() => void add()} disabled={!title.trim()}>
          add
        </Button>
      </div>
      <label className="flex items-center gap-2 text-xs text-whisper">
        <input
          type="checkbox"
          checked={timed}
          onChange={(e) => setTimed(e.target.checked)}
        />
        usually at a set time
      </label>
      {timed && (
        <input
          type="time"
          value={defaultTime}
          onChange={(e) => setDefaultTime(e.target.value)}
          className="w-full rounded-xl border border-beige/50 bg-cream/50 px-3 py-2 text-sm"
        />
      )}
      <p className="text-[10px] text-whisper">
        today: {todayKey(timezone)} — add instances from the calendar tab
      </p>
    </section>
  );
}
