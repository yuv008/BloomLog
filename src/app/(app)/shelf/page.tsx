"use client";

import { MemoryShelf } from "@/components/shelf/memory-shelf";
import { JournalLetters } from "@/components/shelf/journal-letters";
import { useUserId, usePolaroids, useJournalLetters } from "@/hooks/use-bloom-data";
import { Button } from "@/components/primitives/button";
import { useQueryClient } from "@tanstack/react-query";

export default function ShelfPage() {
  const userId = useUserId();
  const { data: polaroids = [] } = usePolaroids(userId);
  const { data: letters = [] } = useJournalLetters(userId);
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

  const refreshJournal = () => {
    if (userId) qc.invalidateQueries({ queryKey: ["journal", userId] });
  };

  return (
    <div className="pb-4">
      <MemoryShelf polaroids={polaroids} />
      {polaroids.length === 0 && userId && (
        <Button variant="ghost" className="w-full mt-4" onClick={generateRecap}>
          preview a cozy polaroid
        </Button>
      )}
      {userId && (
        <JournalLetters userId={userId} letters={letters} onChanged={refreshJournal} />
      )}
    </div>
  );
}
