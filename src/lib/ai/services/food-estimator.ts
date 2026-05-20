import { groqChat, GROQ_MODELS } from "@/lib/ai/groq-client";
import { foodEstimatePrompt } from "@/lib/ai/prompts/food-estimate";
import { foodEstimateSchema, type FoodEstimateOutput } from "@/lib/ai/schemas";

export async function estimateFood(description: string): Promise<{
  estimate: FoodEstimateOutput;
  tokensIn: number;
  tokensOut: number;
}> {
  const trimmed = description.trim().slice(0, 120);
  if (!trimmed) throw new Error("description required");

  const { content, tokensIn, tokensOut } = await groqChat({
    model: GROQ_MODELS.fast,
    messages: [
      { role: "system", content: "You output only valid JSON nutrition estimates." },
      { role: "user", content: foodEstimatePrompt(trimmed) },
    ],
    jsonMode: true,
    max_tokens: 200,
  });

  const parsed = JSON.parse(content) as unknown;
  const result = foodEstimateSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("estimate validation failed");
  }

  return { estimate: result.data, tokensIn, tokensOut };
}
