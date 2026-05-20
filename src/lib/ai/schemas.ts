import { z } from "zod";

export const vibeTagSchema = z.enum([
  "cozy",
  "rainy_day",
  "comfort_food",
  "post_workout",
  "quick_fix",
  "lazy_day",
  "protein_boost",
]);

export const aiRecipeSchema = z.object({
  title: z.string().min(1).max(80),
  cooking_time_min: z.number().int().min(1).max(180),
  calories: z.number().int().min(50).max(2000),
  protein_g: z.number().min(0).max(200),
  carbs_g: z.number().min(0).max(300),
  fat_g: z.number().min(0).max(150),
  steps: z.array(z.string()).min(1).max(8),
  substitutions: z.array(z.string()).optional(),
  vibe_tags: z.array(vibeTagSchema).min(1).max(3),
  caution: z.string().optional(),
});

export const aiRecipeListSchema = z.object({
  recipes: z.array(aiRecipeSchema).min(1).max(3),
});

export const foodEstimateSchema = z.object({
  name: z.string().min(1).max(80),
  calories: z.number().int().min(0).max(3000),
  protein_g: z.number().min(0).max(200),
  carbs_g: z.number().min(0).max(400),
  fat_g: z.number().min(0).max(200),
  confidence: z.enum(["low", "medium"]),
  note: z.string().optional(),
});

export type AiRecipeOutput = z.infer<typeof aiRecipeSchema>;
export type FoodEstimateOutput = z.infer<typeof foodEstimateSchema>;
