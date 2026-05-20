"use client";

import { useRef, useState } from "react";
import { m } from "framer-motion";
import { GardenMoodAtmosphere } from "@/components/garden/garden-mood-atmosphere";
import { getGardenItem } from "@/lib/garden/items";
import type { GardenItem, Mood, RoomTheme } from "@/lib/types";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const MOOD_GARDEN_SUBTITLE: Record<Mood, string> = {
  sunny: "a bright quiet in here",
  cozy: "a cozy quiet in here",
  dreamy: "a dreamy quiet in here",
  rainy: "a rainy quiet in here",
  sleepy: "a sleepy quiet in here",
  golden_hour: "a golden quiet in here",
  stormy: "a stormy quiet in here",
};

export function GardenRoom({
  items,
  roomTheme,
  mood = null,
}: {
  items: GardenItem[];
  roomTheme: RoomTheme;
  mood?: Mood | null;
}) {
  const [story, setStory] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roomLabel =
    roomTheme === "balcony" ? "balcony" : roomTheme === "nook" ? "reading nook" : "windowsill";

  const isEmpty = items.length === 0;

  const showStory = (text: string) => {
    setStory(text);
  };

  const startLongPress = (text: string) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => showStory(text), 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const moodSubtitle = mood ? MOOD_GARDEN_SUBTITLE[mood] : null;

  return (
    <m.div
      className="relative flex w-full max-w-full min-h-[70vh] flex-col overflow-hidden rounded-[28px] bg-cream/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <GardenMoodAtmosphere mood={mood} />

      <header className="relative z-10 shrink-0 px-6 pt-6 pb-2">
        <h1 className="font-display text-2xl text-ink">your {roomLabel}</h1>
        <p className="text-sm text-whisper mt-1">nothing wilts. it just waits.</p>
        {moodSubtitle && (
          <p className="text-sm text-sage mt-1">{moodSubtitle}</p>
        )}
        {!isEmpty && (
          <p className="text-xs text-whisper mt-2">
            {items.length} {items.length === 1 ? "piece" : "pieces"} from your gentle days ·
            long-press for a story
          </p>
        )}
      </header>

      <div className="relative z-10 min-h-0 flex-1 px-4 pb-28">
        {isEmpty ? (
          <div className="flex h-full min-h-[40vh] flex-col items-center justify-center px-4 text-center">
            <p className="text-5xl mb-4" aria-hidden>
              🪴
            </p>
            <p className="font-display text-xl text-ink mb-2">your garden is resting</p>
            <p className="text-sm text-whisper max-w-xs leading-relaxed">
              finish a tiny quest on today — a plant, lamp, or teacup will find its way here. no
              rush.
            </p>
            <p className="mt-6 text-xs text-whisper/80 max-w-[240px]">
              each piece remembers why it arrived. long-press later for its story.
            </p>
          </div>
        ) : (
          <div className="relative h-full min-h-[40vh] w-full overflow-hidden">
            {items.map((item) => {
              const def = getGardenItem(item.item_key);
              const stage = item.bloom_stage;
              const left = clamp(item.position.x, 8, 82);
              const bottom = clamp(20 + item.position.y, 22, 72);
              const storyText = def?.story ?? "a quiet gift from your day";

              return (
                <m.button
                  key={item.id}
                  type="button"
                  className="absolute text-3xl select-none touch-manipulation"
                  style={{
                    left: `${left}%`,
                    bottom: `${bottom}%`,
                    zIndex: item.position.layer,
                    opacity: 0.4 + stage * 0.2,
                    scale: 0.7 + stage * 0.1,
                    transform: "translateX(-50%)",
                  }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3 + item.position.x, repeat: Infinity }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    showStory(storyText);
                  }}
                  onPointerDown={() => startLongPress(storyText)}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onPointerCancel={cancelLongPress}
                  aria-label={def?.name ?? "garden item"}
                >
                  {def?.emoji ?? "🌿"}
                </m.button>
              );
            })}
          </div>
        )}
      </div>

      <m.div
        className="absolute bottom-0 left-0 right-0 z-[1] h-24 bg-beige/80 rounded-t-[40px] pointer-events-none"
        layout
        aria-hidden
      />

      {story && (
        <div
          className="absolute bottom-28 left-4 right-4 z-20 glass-card p-4 max-w-full"
          onClick={() => setStory(null)}
          role="dialog"
          aria-label="item story"
        >
          <p className="text-sm text-ink break-words">{story}</p>
          <p className="text-xs text-whisper mt-2">tap anywhere to close</p>
        </div>
      )}
    </m.div>
  );
}
