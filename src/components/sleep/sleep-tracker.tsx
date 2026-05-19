"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { format, parse, differenceInMinutes } from "date-fns";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { Sheet } from "@/components/primitives/sheet";
import type { SleepQuality } from "@/lib/types";

const QUALITY: { id: SleepQuality; emoji: string }[] = [
  { id: "deep", emoji: "😴" },
  { id: "okay", emoji: "🌙" },
  { id: "restless", emoji: "☁️" },
  { id: "stormy", emoji: "⛈️" },
];

function TimeDial({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div>
      <p className="text-xs text-whisper mb-2">{label}</p>
      <div className="w-full max-w-full min-w-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max min-w-full">
        {hours.map((h) => {
          const t = `${String(h).padStart(2, "0")}:00`;
          return (
            <button
              key={h}
              type="button"
              onClick={() => onChange(t)}
              className={`shrink-0 rounded-full px-3 py-2 text-sm ${
                value.startsWith(String(h).padStart(2, "0")) ? "bg-sage text-cream" : "bg-beige/40"
              }`}
            >
              {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}

export function SleepTrackerCard({
  sleepStart,
  sleepEnd,
  sleepQuality,
  onSave,
}: {
  sleepStart: string | null;
  sleepEnd: string | null;
  sleepQuality: SleepQuality | null;
  onSave: (start: string, end: string, quality: SleepQuality | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("23:00");
  const [end, setEnd] = useState("07:00");
  const [quality, setQuality] = useState<SleepQuality | null>(sleepQuality);

  let arcHours = 0;
  if (sleepStart && sleepEnd) {
    const s = parse(sleepStart, "HH:mm", new Date());
    const e = parse(sleepEnd, "HH:mm", new Date());
    arcHours = Math.max(differenceInMinutes(e, s) / 60, 0);
  }

  return (
    <>
      <Card>
        <p className="font-display text-lg text-ink mb-2">sleep story</p>
        <div className="relative h-24 rounded-[20px] bg-gradient-to-r from-indigo-900/20 via-purple-900/10 to-amber-100/30 overflow-hidden">
          {sleepStart && sleepEnd && (
            <m.div
              className="absolute bottom-4 left-4 right-4 h-1 rounded-full bg-moonlight/40"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: Math.min(arcHours / 10, 1) }}
              style={{ transformOrigin: "left" }}
            />
          )}
          <span className="absolute left-4 top-4 text-lg">🌙</span>
          <span className="absolute right-4 top-4 text-lg">☀️</span>
        </div>
        {arcHours > 0 && (
          <p className="text-sm text-whisper mt-2 tabular-nums">
            {arcHours.toFixed(1)}h of quiet · your softest arc
          </p>
        )}
        <Button variant="ghost" className="w-full mt-3" onClick={() => setOpen(true)}>
          {sleepStart ? "adjust sleep" : "log sleep"}
        </Button>
      </Card>

      <Sheet open={open} onOpenChange={setOpen} title="sleep story">
        <div className="space-y-4">
          <TimeDial label="bedtime" value={start} onChange={setStart} />
          <TimeDial label="wake time" value={end} onChange={setEnd} />
          <p className="text-xs text-whisper">optional quality</p>
          <div className="flex gap-3 justify-center">
            {QUALITY.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setQuality(q.id)}
                className={`text-2xl rounded-full p-2 ${quality === q.id ? "bg-blush/40 ring-1 ring-blush" : ""}`}
              >
                {q.emoji}
              </button>
            ))}
          </div>
          <Button
            className="w-full"
            onClick={async () => {
              const today = format(new Date(), "yyyy-MM-dd");
              await onSave(
                `${today}T${start}:00`,
                `${today}T${end}:00`,
                quality
              );
              setOpen(false);
            }}
          >
            save gently
          </Button>
        </div>
      </Sheet>
    </>
  );
}
