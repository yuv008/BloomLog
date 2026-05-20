"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Sheet } from "@/components/primitives/sheet";
import { Button } from "@/components/primitives/button";
import { MEAL_SLOTS } from "@/lib/health/slots";
import { QUICK_FOOD_CATALOG } from "@/lib/food/quick-catalog";
import { FOOD_TAGS } from "@/lib/food/tags";
import { slotFromParam } from "@/components/health/meal-slot-timeline";
import type { FoodTag, MealSlot } from "@/lib/types";
import type { AddFoodLogMutationInput } from "@/hooks/use-bloom-data";

export function QuickLogSheet({
  open,
  onOpenChange,
  onSave,
  recents,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (input: AddFoodLogMutationInput) => Promise<void>;
  recents: string[];
}) {
  const params = useSearchParams();
  const [slot, setSlot] = useState<MealSlot>(() =>
    slotFromParam(params.get("slot"))
  );
  const [tags, setTags] = useState<FoodTag[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<{
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSlot(slotFromParam(params.get("slot")));
  }, [params]);

  const toggleTag = (t: FoodTag) => {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].slice(0, 2)
    );
  };

  const logQuick = async (item: (typeof QUICK_FOOD_CATALOG)[0]) => {
    await onSave({
      meal_slot: slot,
      name: item.name,
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      emotional_tags: tags,
      source: "quick",
      source_meta: { catalog_id: item.id },
    });
    onOpenChange(false);
    reset();
  };

  const logAi = async () => {
    if (!aiPreview) return;
    await onSave({
      meal_slot: slot,
      name: aiPreview.name,
      calories: aiPreview.calories,
      protein_g: aiPreview.protein_g,
      carbs_g: aiPreview.carbs_g,
      fat_g: aiPreview.fat_g,
      emotional_tags: tags,
      source: "ai_estimate",
    });
    onOpenChange(false);
    reset();
  };

  const logPolaroid = async () => {
    await onSave({
      meal_slot: slot,
      name: "polaroid meal",
      photoFile,
      emotional_tags: tags,
      source: "polaroid",
    });
    onOpenChange(false);
    reset();
  };

  const reset = () => {
    setTags([]);
    setPreview(null);
    setPhotoFile(null);
    setAiText("");
    setAiPreview(null);
  };

  const runEstimate = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/food/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiText }),
      });
      const data = await res.json();
      if (data.estimate) setAiPreview(data.estimate);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredCatalog = QUICK_FOOD_CATALOG.filter(
    (i) => i.meal_slot === slot || slot === "snack"
  ).slice(0, 8);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="log with care">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          {MEAL_SLOTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSlot(s.id)}
              className={`rounded-full px-3 py-1.5 text-xs ${
                slot === s.id ? "bg-blush/50 text-ink" : "bg-beige/40 text-whisper"
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs text-whisper mb-2">quick taps</p>
          <div className="flex flex-wrap gap-2">
            {filteredCatalog.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => logQuick(item)}
                className="rounded-[14px] bg-cream border border-beige/60 px-3 py-2 text-sm text-ink"
              >
                {item.emoji} {item.name}
              </button>
            ))}
          </div>
        </div>

        {recents.length > 0 && (
          <div>
            <p className="text-xs text-whisper mb-2">recent</p>
            <div className="flex flex-wrap gap-2">
              {recents.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    onSave({ meal_slot: slot, name, source: "quick" }).then(() => {
                      onOpenChange(false);
                      reset();
                    })
                  }
                  className="rounded-full bg-sage/20 px-3 py-1 text-xs text-ink"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-whisper mb-2">describe for gentle estimate</p>
          <input
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="paneer rice bowl…"
            className="w-full rounded-[20px] border border-beige bg-cream/80 px-4 py-3 text-sm text-ink"
          />
          <Button
            variant="ghost"
            className="w-full mt-2"
            disabled={aiLoading || !aiText.trim()}
            onClick={runEstimate}
          >
            {aiLoading ? "stirring numbers…" : "gentle estimate"}
          </Button>
          {aiPreview && (
            <div className="mt-2 p-3 rounded-[16px] bg-sage/10 text-sm">
              <p className="text-ink">{aiPreview.name}</p>
              <p className="text-whisper text-xs">
                ~{aiPreview.calories} kcal · P {aiPreview.protein_g}g
              </p>
              <Button className="w-full mt-2" onClick={logAi}>
                save this log
              </Button>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-whisper mb-2">polaroid (optional photo)</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhotoFile(f);
              setPreview(URL.createObjectURL(f));
            }}
          />
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            {preview ? "change photo" : "add photo"}
          </Button>
          {preview && (
            <div className="relative h-28 w-full mt-2 rounded-[12px] overflow-hidden">
              <Image src={preview} alt="" fill className="object-cover" unoptimized />
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {FOOD_TAGS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`rounded-full px-2 py-1 text-xs ${
                  tags.includes(t.id) ? "bg-blush/50" : "bg-beige/40"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-2" onClick={logPolaroid}>
            save polaroid
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
