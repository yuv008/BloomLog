"use client";

import { useEffect } from "react";
import { GardenRoom } from "@/components/garden/garden-room";
import { GardenMoodReflection } from "@/components/garden/garden-mood-reflection";
import { GardenCalendarTeaser } from "@/components/garden/garden-calendar-teaser";
import {
  useUserId,
  useProfile,
  useGarden,
  useDaily,
  useRitualMidnightRefresh,
} from "@/hooks/use-bloom-data";
import { DayContextBar } from "@/components/layout/day-context-bar";

export default function GardenPage() {
  const userId = useUserId();
  const { data: profile } = useProfile(userId);
  const { data: daily } = useDaily(userId);
  const { data: items = [], refetch, isFetching } = useGarden(userId);
  const mood = daily?.mood ?? null;
  useRitualMidnightRefresh(userId);

  useEffect(() => {
    if (userId) void refetch();
  }, [userId, refetch]);

  return (
    <div className="w-full min-w-0 max-w-full">
      <DayContextBar variant="compact" className="mb-3 px-1" />
      <GardenMoodReflection mood={mood} />
      {userId && <GardenCalendarTeaser userId={userId} />}
      <GardenRoom
        items={items}
        roomTheme={profile?.room_theme ?? "windowsill"}
        mood={mood}
      />
      {isFetching && items.length === 0 && (
        <p className="mt-2 text-center text-xs text-whisper">checking your garden…</p>
      )}
    </div>
  );
}
