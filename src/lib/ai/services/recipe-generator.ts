import { groqChat, GROQ_MODELS } from "@/lib/ai/groq-client";
import { recipeFromIngredientsPrompt } from "@/lib/ai/prompts/recipe-from-ingredients";
import type { AiRecipeOutput } from "@/lib/ai/schemas";
import { parseRecipeListPayload } from "@/lib/ai/normalize-recipe";
import { getCachedRecipes, setCachedRecipes } from "@/lib/ai/cache";
import { hashIngredients } from "@/lib/ai/hash";

export async function generateRecipesFromIngredients(
  ingredients: string
): Promise<{
  recipes: AiRecipeOutput[];
  cached: boolean;
  hash: string;
  tokensIn?: number;
  tokensOut?: number;
}> {
  const trimmed = ingredients.trim().slice(0, 200);
  if (!trimmed) throw new Error("ingredients required");

  const hash = hashIngredients(trimmed);
  const cached = await getCachedRecipes(hash);
  if (cached?.length) {
    return { recipes: cached, cached: true, hash };
  }

  const { content, tokensIn, tokensOut } = await groqChat({
    model: GROQ_MODELS.quality,
    messages: [
      {
        role: "system",
        content: "You output only valid JSON for cozy home recipes.",
      },
      { role: "user", content: recipeFromIngredientsPrompt(trimmed) },
    ],
    jsonMode: true,
    max_tokens: 1200,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("invalid AI response");
  }

  const recipes = parseRecipeListPayload(parsed);

  await setCachedRecipes(hash, recipes);

  return {
    recipes,
    cached: false,
    hash,
    tokensIn,
    tokensOut,
  };
}
