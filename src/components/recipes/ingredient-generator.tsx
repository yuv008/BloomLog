"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/card";
import type { AiRecipeOutput } from "@/lib/ai/schemas";
import { HEALTH_DISCLAIMER } from "@/lib/health/copy";

export function IngredientGenerator({
  onSave,
}: {
  onSave: (ingredients: string, recipe: AiRecipeOutput) => Promise<void>;
}) {
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<AiRecipeOutput[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const trimmed = ingredients.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "couldn't reach the cozy kitchen");
        return;
      }
      setRecipes(data.recipes ?? []);
    } catch {
      setError("something went quiet — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-whisper">
        list what you have — comma separated. we will suggest cozy recipes.
      </p>
      <textarea
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        placeholder="paneer, rice, onion…"
        rows={3}
        className="w-full rounded-[20px] border border-beige bg-cream/80 px-4 py-3 text-ink text-sm resize-none"
      />
      <Button className="w-full" onClick={generate} disabled={loading || !ingredients.trim()}>
        {loading ? "stirring ideas…" : "what can I cook?"}
      </Button>
      {error && <p className="text-sm text-blush">{error}</p>}
      <p className="text-[10px] text-whisper">{HEALTH_DISCLAIMER}</p>

      <AnimatePresence>
        {recipes.map((recipe, i) => (
          <m.div
            key={`${recipe.title}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h3 className="font-display text-xl text-ink">{recipe.title}</h3>
              <p className="text-xs text-whisper mt-1">
                {recipe.cooking_time_min} min · ~{recipe.calories} kcal
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {recipe.vibe_tags.map((t) => (
                  <span key={t} className="text-[10px] rounded-full bg-beige/50 px-2 py-0.5">
                    {t.replace("_", " ")}
                  </span>
                ))}
              </div>
              <ol className="mt-3 space-y-1 text-sm text-ink list-decimal list-inside">
                {recipe.steps.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
              <Button
                variant="blush"
                className="w-full mt-3"
                onClick={() => onSave(ingredients.trim(), recipe)}
              >
                save recipe
              </Button>
            </Card>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
