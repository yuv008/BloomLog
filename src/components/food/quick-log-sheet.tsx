"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Sheet } from "@/components/primitives/sheet";
import { Button } from "@/components/primitives/button";
import { MEAL_SLOTS } from "@/lib/health/slots";
import { QUICK_FOOD_CATALOG, type QuickFoodItem } from "@/lib/food/quick-catalog";
import { FOOD_TAGS } from "@/lib/food/tags";
import { slotFromParam } from "@/components/health/meal-slot-timeline";
import type { FoodTag, MealSlot } from "@/lib/types";
import type { AddFoodLogMutationInput } from "@/hooks/use-bloom-data";

type AiEstimate = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type LogDraft =
  | { kind: "catalog"; item: QuickFoodItem }
  | { kind: "recent"; name: string }
  | { kind: "ai"; estimate: AiEstimate }
  | { kind: "polaroid" };

function draftLabel(draft: LogDraft | null): string | null {
  if (!draft) return null;
  switch (draft.kind) {
    case "catalog":
      return `${draft.item.emoji} ${draft.item.name}`;
    case "recent":
      return draft.name;
    case "ai":
      return draft.estimate.name;
    case "polaroid":
      return "photo memory";
  }
}

function isSameDraft(a: LogDraft | null, b: LogDraft): boolean {
  if (!a) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === "catalog" && b.kind === "catalog") return a.item.id === b.item.id;
  if (a.kind === "recent" && b.kind === "recent") return a.name === b.name;
  if (a.kind === "ai" && b.kind === "ai") return a.estimate.name === b.estimate.name;
  return a.kind === "polaroid" && b.kind === "polaroid";
}

export function QuickLogSheet({
  open,
  onOpenChange,
  onSave,
  recents,
  saving = false,
  saveError = null,
  onClearError,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (input: AddFoodLogMutationInput) => Promise<void>;
  recents: string[];
  saving?: boolean;
  saveError?: string | null;
  onClearError?: () => void;
}) {
  const params = useSearchParams();
  const [slot, setSlot] = useState<MealSlot>(() =>
    slotFromParam(params.get("slot"))
  );
  const [draft, setDraft] = useState<LogDraft | null>(null);
  const [tags, setTags] = useState<FoodTag[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<AiEstimate | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSlot(slotFromParam(params.get("slot")));
  }, [params]);

  const toggleTag = (t: FoodTag) => {
    onClearError?.();
    setLocalError(null);
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].slice(0, 2)
    );
  };

  const reset = useCallback(() => {
    setDraft(null);
    setTags([]);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPhotoFile(null);
    setAiText("");
    setAiPreview(null);
    setLocalError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [preview]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const selectDraft = (next: LogDraft) => {
    onClearError?.();
    setLocalError(null);
    setDraft(next);
  };

  const buildPayload = (): AddFoodLogMutationInput | null => {
    const photo = photoFile ?? undefined;
    const emotional_tags = tags.length ? tags : undefined;

    if (draft?.kind === "catalog") {
      const { item } = draft;
      return {
        meal_slot: slot,
        name: item.name,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        emotional_tags,
        photoFile: photo,
        source: "quick",
        source_meta: { catalog_id: item.id },
      };
    }
    if (draft?.kind === "recent") {
      return {
        meal_slot: slot,
        name: draft.name,
        emotional_tags,
        photoFile: photo,
        source: "quick",
      };
    }
    if (draft?.kind === "ai") {
      const e = draft.estimate;
      return {
        meal_slot: slot,
        name: e.name,
        calories: e.calories,
        protein_g: e.protein_g,
        carbs_g: e.carbs_g,
        fat_g: e.fat_g,
        emotional_tags,
        photoFile: photo,
        source: "ai_estimate",
      };
    }
    if (draft?.kind === "polaroid" || photo) {
      return {
        meal_slot: slot,
        name: "polaroid meal",
        emotional_tags,
        photoFile: photo,
        source: "polaroid",
      };
    }
    return null;
  };

  const canSave = () => {
    if (saving) return false;
    const payload = buildPayload();
    if (!payload) return false;
    if (draft?.kind === "polaroid" && !photoFile) return false;
    return true;
  };

  const saveLog = async () => {
    onClearError?.();
    setLocalError(null);
    const payload = buildPayload();
    if (!payload) {
      setLocalError("pick something to log, or add a photo for a memory shelf polaroid");
      return;
    }
    if (draft?.kind === "polaroid" && !photoFile) {
      setLocalError("add a photo for your memory shelf polaroid");
      return;
    }
    try {
      await onSave(payload);
      onOpenChange(false);
      reset();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "could not save");
    }
  };

  const runEstimate = async () => {
    if (!aiText.trim()) return;
    onClearError?.();
    setLocalError(null);
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

  const displayError = saveError ?? localError;
  const loggingLabel = draftLabel(draft);

  const chipClass = (selected: boolean) =>
    selected
      ? "ring-2 ring-blush/60 bg-blush/30 border-blush/50"
      : "bg-cream border-beige/60";

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="log with care">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pb-2">
        <div className="flex flex-wrap gap-2">
          {MEAL_SLOTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSlot(s.id);
                setDraft(null);
              }}
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
            {filteredCatalog.map((item) => {
              const d: LogDraft = { kind: "catalog", item };
              const selected = isSameDraft(draft, d);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectDraft(d)}
                  className={`rounded-[14px] border px-3 py-2 text-sm text-ink ${chipClass(selected)}`}
                >
                  {item.emoji} {item.name}
                </button>
              );
            })}
          </div>
        </div>

        {recents.length > 0 && (
          <div>
            <p className="text-xs text-whisper mb-2">recent</p>
            <div className="flex flex-wrap gap-2">
              {recents.map((name) => {
                const d: LogDraft = { kind: "recent", name };
                const selected = isSameDraft(draft, d);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectDraft(d)}
                    className={`rounded-full px-3 py-1 text-xs text-ink border ${
                      selected ? "ring-2 ring-sage/50 bg-sage/30" : "bg-sage/20 border-transparent"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
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
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => {
                  selectDraft({ kind: "ai", estimate: aiPreview });
                  setAiPreview(null);
                }}
              >
                use this estimate
              </Button>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-whisper mb-2">polaroid (optional photo)</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,image/heic,image/heif"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              onClearError?.();
              setLocalError(null);
              if (preview) URL.revokeObjectURL(preview);
              setPhotoFile(f);
              setPreview(URL.createObjectURL(f));
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? "change photo" : "add photo"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (preview) URL.revokeObjectURL(preview);
                setPreview(null);
                setPhotoFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              no photo
            </Button>
          </div>
          {preview && (
            <div className="relative h-28 w-full mt-2 rounded-[12px] overflow-hidden">
              <Image src={preview} alt="" fill className="object-cover" unoptimized />
            </div>
          )}
          <p className="text-[10px] text-whisper mt-2">
            photos appear on your memory shelf
          </p>
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
          <Button
            variant="ghost"
            className="w-full mt-2 text-xs"
            onClick={() => selectDraft({ kind: "polaroid" })}
          >
            {draft?.kind === "polaroid"
              ? "photo memory selected"
              : "log photo memory only"}
          </Button>
        </div>

        {loggingLabel && (
          <p className="text-sm text-ink text-center">
            logging: <span className="font-medium">{loggingLabel}</span>
          </p>
        )}

        {displayError && (
          <p className="text-xs text-blush text-center px-2">{displayError}</p>
        )}

        <Button className="w-full" disabled={!canSave()} onClick={saveLog}>
          {saving ? "saving…" : "save log"}
        </Button>
      </div>
    </Sheet>
  );
}
