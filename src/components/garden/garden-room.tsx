"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { getGardenItem } from "@/lib/garden/items";
import type { GardenItem, RoomTheme } from "@/lib/types";

export function GardenRoom({
  items,
  roomTheme,
}: {
  items: GardenItem[];
  roomTheme: RoomTheme;
}) {
  const [story, setStory] = useState<string | null>(null);

  const roomLabel =
    roomTheme === "balcony" ? "balcony" : roomTheme === "nook" ? "reading nook" : "windowsill";

  return (
    <div className="relative min-h-[70vh] rounded-[28px] bg-gradient-to-b from-beige/60 to-cream overflow-hidden">
      <p className="absolute top-6 left-6 font-display text-2xl text-ink z-10">your {roomLabel}</p>
      <p className="absolute top-14 left-6 text-sm text-whisper z-10">nothing wilts. it just waits.</p>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-beige/80 rounded-t-[40px]" />

      {items.map((item) => {
        const def = getGardenItem(item.item_key);
        const stage = item.bloom_stage;
        return (
          <m.button
            key={item.id}
            type="button"
            className="absolute text-3xl select-none"
            style={{
              left: `${item.position.x}%`,
              bottom: `${20 + item.position.y}%`,
              zIndex: item.position.layer,
              opacity: 0.4 + stage * 0.2,
              scale: 0.7 + stage * 0.1,
            }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3 + item.position.x, repeat: Infinity }}
            onContextMenu={(e) => {
              e.preventDefault();
              setStory(def?.story ?? "a quiet gift from your day");
            }}
          >
            {def?.emoji ?? "🌿"}
          </m.button>
        );
      })}

      {story && (
        <div
          className="absolute bottom-28 left-6 right-6 glass-card p-4 z-20"
          onClick={() => setStory(null)}
        >
          <p className="text-sm text-ink">{story}</p>
        </div>
      )}
    </div>
  );
}
