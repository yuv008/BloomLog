import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import { checkAiRateLimit, logAiUsage } from "@/lib/ai/rate-limit";
import { moderateUserText } from "@/lib/ai/services/moderation";
import { generateRecipesFromIngredients } from "@/lib/ai/services/recipe-generator";
import { RECIPES } from "@/lib/recipes/data";

export async function POST(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;

  const body = (await req.json()) as { ingredients?: string };
  const ingredients = body.ingredients?.trim();
  if (!ingredients) {
    return NextResponse.json({ error: "ingredients required" }, { status: 400 });
  }

  const safe = await moderateUserText(ingredients);
  if (!safe) {
    return NextResponse.json({ error: "Let's keep this gentle and nourishing." }, { status: 400 });
  }

  const rate = await checkAiRateLimit(userId, "recipes/generate");
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "You've stirred enough magic for today. Try again tomorrow." },
      { status: 429 }
    );
  }

  if (!process.env.GROQ_API_KEY) {
    const fallback = RECIPES.slice(0, 2).map((r) => ({
      title: r.title,
      cooking_time_min: parseInt(r.time, 10) || 15,
      calories: 350,
      protein_g: 12,
      carbs_g: 40,
      fat_g: 14,
      steps: r.steps,
      vibe_tags: ["cozy" as const],
      caution: "Fallback recipe — AI kitchen is resting.",
    }));
    return NextResponse.json({ recipes: fallback, cached: false, fallback: true });
  }

  try {
    const result = await generateRecipesFromIngredients(ingredients);
    if (!result.cached && result.tokensIn != null) {
      await logAiUsage(userId, "recipes/generate", result.tokensIn, result.tokensOut ?? 0);
    }
    return NextResponse.json({
      recipes: result.recipes,
      cached: result.cached,
      ingredientsHash: result.hash,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generation failed";
    const fallback = RECIPES.filter((r) =>
      ingredients.toLowerCase().split(/[+,]/).some((part) =>
        r.title.toLowerCase().includes(part.trim())
      )
    ).slice(0, 2);
    if (fallback.length) {
      return NextResponse.json({
        recipes: fallback.map((r) => ({
          title: r.title,
          cooking_time_min: parseInt(r.time, 10) || 15,
          calories: 350,
          protein_g: 12,
          carbs_g: 40,
          fat_g: 14,
          steps: r.steps,
          vibe_tags: ["cozy"],
        })),
        cached: false,
        fallback: true,
      });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
