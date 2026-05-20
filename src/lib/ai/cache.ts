import { createClient } from "@/lib/supabase/server";
import type { AiRecipeOutput } from "@/lib/ai/schemas";
export { hashIngredients } from "@/lib/ai/hash";

export async function getCachedRecipes(
  ingredientsHash: string
): Promise<AiRecipeOutput[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ai_recipes_cache")
    .select("payload, expires_at")
    .eq("ingredients_hash", ingredientsHash)
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at as string) < new Date()) return null;
  const payload = data.payload as { recipes?: AiRecipeOutput[] };
  return payload.recipes ?? null;
}

export async function setCachedRecipes(
  ingredientsHash: string,
  recipes: AiRecipeOutput[]
) {
  const supabase = await createClient();
  if (!supabase) return;

  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  await supabase.from("ai_recipes_cache").upsert({
    ingredients_hash: ingredientsHash,
    payload: { recipes },
    expires_at: expires.toISOString(),
  });
}
