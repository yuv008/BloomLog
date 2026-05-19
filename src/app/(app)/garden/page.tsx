"use client";

import { GardenRoom } from "@/components/garden/garden-room";
import { useUserId, useProfile, useGarden } from "@/hooks/use-bloom-data";

export default function GardenPage() {
  const userId = useUserId();
  const { data: profile } = useProfile(userId);
  const { data: items = [] } = useGarden(userId);

  return (
    <GardenRoom
      items={items}
      roomTheme={profile?.room_theme ?? "windowsill"}
    />
  );
}
