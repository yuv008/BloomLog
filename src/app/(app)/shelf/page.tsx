"use client";

import { MemoryShelf } from "@/components/shelf/memory-shelf";
import { useUserId, usePolaroids } from "@/hooks/use-bloom-data";
import { Button } from "@/components/primitives/button";
import { useQueryClient } from "@tanstack/react-query";

export default function ShelfPage() {
  const userId = useUserId();
  const { data: polaroids = [] } = usePolaroids(userId);
  const qc = useQueryClient();

  const generateRecap = async () => {
    if (!userId) return;
    const cozy: import("@/lib/types").MemoryPolaroid = {
      id: crypto.randomUUID(),
      user_id: userId,
      kind: "cozy_week",
      period_start: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
      period_end: new Date().toISOString().slice(0, 10),
      payload: { label: "your coziest week", cozy_days: 4 },
      created_at: new Date().toISOString(),
    };
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { localStore } = await import("@/lib/storage/local");
      localStore.addPolaroid(cozy);
    }
    qc.invalidateQueries({ queryKey: ["polaroids", userId] });
  };

  return (
    <div>
      <MemoryShelf polaroids={polaroids} />
      {polaroids.length === 0 && userId && (
        <Button variant="ghost" className="w-full mt-4" onClick={generateRecap}>
          preview a cozy polaroid
        </Button>
      )}
    </div>
  );
}
