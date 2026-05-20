"use client";

import { useEffect } from "react";
import { GardenRoom } from "@/components/garden/garden-room";
import { GardenMoodReflection } from "@/components/garden/garden-mood-reflection";
import { useUserId, useProfile, useGarden, useDaily } from "@/hooks/use-bloom-data";

export default function GardenPage() {
  const userId = useUserId();
  const { data: profile } = useProfile(userId);
  const { data: daily } = useDaily(userId);
  const { data: items = [], refetch, isFetching } = useGarden(userId);
  const mood = daily?.mood ?? null;

  useEffect(() => {
    if (userId) void refetch();
  }, [userId, refetch]);

  return (
    <div className="w-full min-w-0 max-w-full">
      <GardenMoodReflection mood={mood} />
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
