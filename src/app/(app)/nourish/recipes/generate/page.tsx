"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IngredientGenerator } from "@/components/recipes/ingredient-generator";
import { useUserId, useInvalidateNourish } from "@/hooks/use-bloom-data";
import * as api from "@/lib/data/api";
import { hashIngredients } from "@/lib/ai/hash";
import type { AiRecipeOutput } from "@/lib/ai/schemas";
import { trackEvent } from "@/lib/analytics/posthog";

export default function GenerateRecipesPage() {
  const router = useRouter();
  const userId = useUserId();
  const invalidate = useInvalidateNourish();

  const onSave = async (ingredients: string, recipe: AiRecipeOutput) => {
    if (!userId) return;
    const hash = hashIngredients(ingredients);
    const saved = await api.saveAiRecipe(userId, ingredients, hash, recipe);
    invalidate(userId);
    trackEvent("ai_recipe_saved", { title: recipe.title });
    router.push(`/nourish/recipes/${saved.id}`);
  };

  return (
    <div className="space-y-4 pb-4">
      <Link href="/nourish/recipes" className="text-xs text-sage">
        ← recipe nook
      </Link>
      <h1 className="font-display text-2xl text-ink">cozy kitchen AI</h1>
      <IngredientGenerator onSave={onSave} />
    </div>
  );
}
