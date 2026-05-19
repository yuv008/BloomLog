"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { Sheet } from "@/components/primitives/sheet";
import { FOOD_TAGS } from "@/lib/food/tags";
import type { Meal, FoodTag } from "@/lib/types";

export function MealTimelineCard({
  meals,
  onAdd,
}: {
  meals: Meal[];
  onAdd: (tags: FoodTag[], photo?: string | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<FoodTag[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleTag = (t: FoodTag) => {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].slice(0, 2)
    );
  };

  const handlePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Card>
        <p className="font-display text-lg text-ink mb-3">meal polaroids</p>
        <div className="space-y-3">
          {meals.length === 0 ? (
            <p className="text-sm text-whisper">no meals yet. tap to log without typing.</p>
          ) : (
            meals.map((meal) => (
              <article
                key={meal.id}
                className="rounded-[20px] border border-beige/60 bg-cream/80 p-3 rotate-[0.5deg] even:-rotate-[0.5deg]"
              >
                {meal.photo_url && (
                  <div className="relative mb-2 h-32 w-full overflow-hidden rounded-[12px]">
                    <Image src={meal.photo_url} alt="" fill className="object-cover" unoptimized />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {meal.tags.map((t) => {
                    const tag = FOOD_TAGS.find((x) => x.id === t);
                    return (
                      <span key={t} className="rounded-full bg-beige/60 px-2 py-0.5 text-xs text-ink">
                        {tag?.emoji} {tag?.label}
                      </span>
                    );
                  })}
                </div>
              </article>
            ))
          )}
        </div>
        <Button variant="ghost" className="w-full mt-3" onClick={() => setOpen(true)}>
          + log a meal
        </Button>
      </Card>

      <Sheet open={open} onOpenChange={setOpen} title="log meal">
        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePhoto(f);
            }}
          />
          <div className="flex gap-2">
            <Button variant="glass" className="flex-1" onClick={() => fileRef.current?.click()}>
              {preview ? "change photo" : "add photo"}
            </Button>
            <Button variant="ghost" onClick={() => setPreview(null)}>
              no photo
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {FOOD_TAGS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  tags.includes(t.id) ? "bg-blush/50 text-ink" : "bg-beige/40 text-whisper"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <Button
            className="w-full"
            disabled={tags.length === 0}
            onClick={async () => {
              await onAdd(tags, preview);
              setOpen(false);
              setTags([]);
              setPreview(null);
            }}
          >
            save polaroid
          </Button>
        </div>
      </Sheet>
    </>
  );
}
