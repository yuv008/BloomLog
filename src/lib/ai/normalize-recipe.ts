import { aiRecipeListSchema, vibeTagSchema, type AiRecipeOutput } from "@/lib/ai/schemas";

const VIBE_ALIASES: Record<string, (typeof vibeTagSchema.enum)[keyof typeof vibeTagSchema.enum]> = {
  cozy: "cozy",
  rainy: "rainy_day",
  rainy_day: "rainy_day",
  comfort: "comfort_food",
  comfort_food: "comfort_food",
  post_workout: "post_workout",
  workout: "post_workout",
  quick: "quick_fix",
  quick_fix: "quick_fix",
  lazy: "lazy_day",
  lazy_day: "lazy_day",
  protein: "protein_boost",
  protein_boost: "protein_boost",
};

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeVibeTags(raw: unknown): AiRecipeOutput["vibe_tags"] {
  const arr = Array.isArray(raw) ? raw : [];
  const tags: AiRecipeOutput["vibe_tags"] = [];
  for (const item of arr) {
    const key = String(item).toLowerCase().replace(/\s+/g, "_");
    const mapped = VIBE_ALIASES[key];
    if (mapped && !tags.includes(mapped)) tags.push(mapped);
    if (tags.length >= 3) break;
  }
  return tags.length ? tags : ["cozy"];
}

function normalizeOne(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    title: String(raw.title ?? raw.name ?? "Cozy dish").slice(0, 80),
    cooking_time_min: Math.round(num(raw.cooking_time_min ?? raw.cook_time ?? raw.time ?? 15)),
    calories: Math.round(num(raw.calories ?? raw.kcal ?? 350)),
    protein_g: num(raw.protein_g ?? raw.protein ?? 12),
    carbs_g: num(raw.carbs_g ?? raw.carbs ?? 40),
    fat_g: num(raw.fat_g ?? raw.fat ?? 14),
    steps: Array.isArray(raw.steps)
      ? raw.steps.map((s) => String(s)).slice(0, 8)
      : ["Prepare ingredients with care.", "Cook gently and serve warm."],
    substitutions: Array.isArray(raw.substitutions)
      ? raw.substitutions.map((s) => String(s))
      : undefined,
    vibe_tags: normalizeVibeTags(raw.vibe_tags ?? raw.tags ?? raw.vibe),
    caution: raw.caution ? String(raw.caution) : undefined,
  };
}

export function parseRecipeListPayload(parsed: unknown): AiRecipeOutput[] {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("invalid AI response");
  }
  const obj = parsed as Record<string, unknown>;
  let list: Record<string, unknown>[] = [];
  if (Array.isArray(obj.recipes)) {
    list = obj.recipes as Record<string, unknown>[];
  } else if (obj.title || obj.steps) {
    list = [obj];
  }

  const normalized = list.map(normalizeOne);
  const result = aiRecipeListSchema.safeParse({ recipes: normalized });
  if (!result.success) {
    console.warn("[bloomlog] recipe normalize:", result.error.flatten());
    throw new Error("recipe validation failed");
  }
  return result.data.recipes;
}
