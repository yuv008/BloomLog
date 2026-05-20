import { readFileSync } from "fs";

process.env.GROQ_API_KEY =
  process.env.GROQ_API_KEY ||
  readFileSync(".env.local", "utf8").match(/GROQ_API_KEY=(.+)/)?.[1]?.trim();

const { generateRecipesFromIngredients } = await import(
  "../src/lib/ai/services/recipe-generator.ts"
);

try {
  const r = await generateRecipesFromIngredients("paneer, rice, onion");
  console.log("OK", r.recipes.length, r.recipes[0]?.title, "cached=", r.cached);
} catch (e) {
  console.error("ERR", e.message);
  process.exit(1);
}
