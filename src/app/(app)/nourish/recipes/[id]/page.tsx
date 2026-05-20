"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RECIPES } from "@/lib/recipes/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/primitives/button";
import { useUserId, useInvalidateNourish } from "@/hooks/use-bloom-data";
import * as api from "@/lib/data/api";
import type { AiRecipePayload } from "@/lib/types";

export default function NourishRecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = useUserId();
  const router = useRouter();
  const invalidate = useInvalidateNourish();
  const staticRecipe = RECIPES.find((r) => r.slug === id);
  const [aiPayload, setAiPayload] = useState<AiRecipePayload | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (staticRecipe) {
      setTitle(staticRecipe.title);
      return;
    }
    if (!userId || !id) return;
    api.getAiRecipeById(userId, id).then((r) => {
      if (r) {
        setAiPayload(r.payload);
        setTitle(r.payload.title);
      }
    });
  }, [userId, id, staticRecipe]);

  const logMeal = async () => {
    if (!userId) return;
    if (staticRecipe) {
      await api.addFoodLog(userId, {
        meal_slot: "dinner",
        name: staticRecipe.title,
        source: "recipe",
        source_meta: { slug: staticRecipe.slug },
      });
    } else if (aiPayload) {
      await api.addFoodLog(userId, {
        meal_slot: "dinner",
        name: aiPayload.title,
        calories: aiPayload.calories,
        protein_g: aiPayload.protein_g,
        carbs_g: aiPayload.carbs_g,
        fat_g: aiPayload.fat_g,
        source: "recipe",
        source_meta: { ai_recipe_id: id },
      });
    }
    invalidate(userId);
    router.push("/nourish");
  };

  if (!staticRecipe && !aiPayload) {
    return (
      <div className="text-whisper py-12 text-center">
        {userId ? "recipe not found" : "loading…"}
      </div>
    );
  }

  if (staticRecipe) {
    return (
      <article className="space-y-6 pb-8 w-full min-w-0">
        <Link href="/nourish/recipes" className="text-sm text-whisper">
          ← recipe nook
        </Link>
        <div className={cn("rounded-[28px] p-8 bg-gradient-to-br", staticRecipe.gradient)}>
          <span className="text-5xl">{staticRecipe.emoji}</span>
          <h1 className="font-display text-3xl text-ink mt-4">{staticRecipe.title}</h1>
          <p className="text-whisper text-sm mt-1">{staticRecipe.time}</p>
        </div>
        <p className="text-ink leading-relaxed">{staticRecipe.description}</p>
        <ol className="space-y-3">
          {staticRecipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink">
              <span className="font-display text-blush">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
        <Button className="w-full" onClick={logMeal}>
          log this cozy meal
        </Button>
      </article>
    );
  }

  return (
    <article className="space-y-6 pb-8 w-full min-w-0">
      <Link href="/nourish/recipes" className="text-sm text-whisper">
        ← recipe nook
      </Link>
      <div className="rounded-[28px] p-8 bg-gradient-to-br from-sage/20 to-cream">
        <h1 className="font-display text-3xl text-ink">{title}</h1>
        <p className="text-whisper text-sm mt-1">
          {aiPayload!.cooking_time_min} min · ~{aiPayload!.calories} kcal
        </p>
        <div className="flex flex-wrap gap-1 mt-3">
          {aiPayload!.vibe_tags.map((t) => (
            <span key={t} className="text-xs rounded-full bg-beige/60 px-2 py-0.5">
              {t}
            </span>
          ))}
        </div>
      </div>
      <ol className="space-y-3">
        {aiPayload!.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-ink">
            <span className="font-display text-blush">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
      {aiPayload!.caution && (
        <p className="text-xs text-whisper">{aiPayload!.caution}</p>
      )}
      <Button className="w-full" onClick={logMeal}>
        log this meal gently
      </Button>
    </article>
  );
}
