"use client";

import { useEffect } from "react";
import { GardenRoom } from "@/components/garden/garden-room";
import { useUserId, useProfile, useGarden } from "@/hooks/use-bloom-data";

export default function GardenPage() {
  const userId = useUserId();
  const { data: profile } = useProfile(userId);
  const { data: items = [], refetch, isFetching } = useGarden(userId);

  useEffect(() => {
    if (userId) void refetch();
  }, [userId, refetch]);

  return (
    <div className="w-full min-w-0 max-w-full">
      <GardenRoom
        items={items}
        roomTheme={profile?.room_theme ?? "windowsill"}
      />
      {isFetching && items.length === 0 && (
        <p className="mt-2 text-center text-xs text-whisper">checking your garden…</p>
      )}
    </div>
  );
}
