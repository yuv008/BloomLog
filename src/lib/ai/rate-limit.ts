import { createClient } from "@/lib/supabase/server";

const LIMITS: Record<string, { daily: number }> = {
  "recipes/generate": { daily: 10 },
  "food/estimate": { daily: 30 },
};

export async function checkAiRateLimit(
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = LIMITS[endpoint]?.daily ?? 20;
  const supabase = await createClient();
  if (!supabase) {
    return { allowed: true, remaining: limit };
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("ai_usage_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("created_at", start.toISOString());

  if (error) {
    return { allowed: true, remaining: limit };
  }

  const used = count ?? 0;
  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}

export async function logAiUsage(
  userId: string,
  endpoint: string,
  tokensIn: number,
  tokensOut: number
) {
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.from("ai_usage_log").insert({
    user_id: userId,
    endpoint,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });
}
