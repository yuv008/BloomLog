"use client";

import { formatRitualDayLabel, ritualDayWhisper } from "@/lib/dates";
import { useUserPreferences } from "@/components/providers/user-preferences";
import { cn } from "@/lib/utils";

export function DayContextBar({
  variant = "default",
  className,
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  const { timezone } = useUserPreferences();
  const label = formatRitualDayLabel(new Date(), timezone);
  const whisper = ritualDayWhisper(timezone);

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 gap-y-0.5",
        variant === "compact" ? "text-xs" : "text-sm",
        className
      )}
    >
      <span className="text-whisper capitalize">{label}</span>
      <span className="text-sage/90 font-medium">today</span>
      {whisper && (
        <span className="text-whisper/80 italic">· {whisper}</span>
      )}
    </div>
  );
}
