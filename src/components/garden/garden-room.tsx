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

  const isEmpty = items.length === 0;

  return (
    <m.div
      className="relative min-h-[70vh] rounded-[28px] bg-gradient-to-b from-beige/60 to-cream overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p className="absolute top-6 left-6 font-display text-2xl text-ink z-10">your {roomLabel}</p>
      <p className="absolute top-14 left-6 text-sm text-whisper z-10 max-w-[85%]">
        nothing wilts. it just waits.
      </p>

      <m.div
        className="absolute bottom-0 left-0 right-0 h-24 bg-beige/80 rounded-t-[40px]"
        layout
      />

      {isEmpty ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center z-10 pb-20">
          <p className="text-5xl mb-4" aria-hidden>
            🪴
          </p>
          <p className="font-display text-xl text-ink mb-2">your shelf is resting</p>
          <p className="text-sm text-whisper max-w-xs leading-relaxed">
            finish a tiny quest on today — a plant, lamp, or teacup will find its way here. no
            rush.
          </p>
          <p className="mt-6 text-xs text-whisper/80 max-w-[240px]">
            each piece remembers why it arrived. long-press (or right-click) later for its story.
          </p>
        </div>
      ) : (
        <>
          <p className="absolute top-[4.5rem] left-6 right-6 text-xs text-whisper z-10">
            {items.length} {items.length === 1 ? "piece" : "pieces"} from your gentle days ·
            long-press for a story
          </p>
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
                aria-label={def?.name ?? "garden item"}
              >
                {def?.emoji ?? "🌿"}
              </m.button>
            );
          })}
        </>
      )}

      {story && (
        <div
          className="absolute bottom-28 left-6 right-6 glass-card p-4 z-20"
          onClick={() => setStory(null)}
          role="dialog"
          aria-label="item story"
        >
          <p className="text-sm text-ink">{story}</p>
          <p className="text-xs text-whisper mt-2">tap anywhere to close</p>
        </div>
      )}
    </m.div>
  );
}
