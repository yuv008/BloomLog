import { groqChat, GROQ_MODELS } from "@/lib/ai/groq-client";
import { moderationPrompt } from "@/lib/ai/prompts/moderation";

export async function moderateUserText(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return true;

  const blocked = /\b(purge|anorexia|starve|suicide)\b/i;
  if (blocked.test(trimmed)) return false;

  if (!process.env.GROQ_API_KEY) return true;

  try {
    const { content } = await groqChat({
      model: GROQ_MODELS.fast,
      messages: [
        { role: "system", content: "Output only JSON." },
        { role: "user", content: moderationPrompt(trimmed) },
      ],
      jsonMode: true,
      max_tokens: 60,
    });
    const parsed = JSON.parse(content) as { status?: string };
    return parsed.status === "safe";
  } catch {
    return true;
  }
}
