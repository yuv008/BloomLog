const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function groqChat(params: {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  jsonMode?: boolean;
}): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.4,
      max_tokens: params.max_tokens ?? 800,
      response_format: params.jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${res.status} ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  return {
    content,
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
  };
}

export const GROQ_MODELS = {
  quality: "llama-3.3-70b-versatile",
  fast: "llama-3.1-8b-instant",
} as const;
