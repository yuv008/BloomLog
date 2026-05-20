import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import { checkAiRateLimit, logAiUsage } from "@/lib/ai/rate-limit";
import { moderateUserText } from "@/lib/ai/services/moderation";
import { estimateFood } from "@/lib/ai/services/food-estimator";

export async function POST(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;

  const body = (await req.json()) as { description?: string };
  const description = body.description?.trim();
  if (!description) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }

  const safe = await moderateUserText(description);
  if (!safe) {
    return NextResponse.json({ error: "Let's keep this gentle and nourishing." }, { status: 400 });
  }

  const rate = await checkAiRateLimit(userId, "food/estimate");
  if (!rate.allowed) {
    return NextResponse.json({ error: "Estimate limit reached for today." }, { status: 429 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({
      estimate: {
        name: description.slice(0, 40),
        calories: 300,
        protein_g: 10,
        carbs_g: 35,
        fat_g: 12,
        confidence: "low" as const,
        note: "Rough placeholder — add GROQ_API_KEY for estimates.",
      },
      fallback: true,
    });
  }

  try {
    const { estimate, tokensIn, tokensOut } = await estimateFood(description);
    await logAiUsage(userId, "food/estimate", tokensIn, tokensOut);
    return NextResponse.json({ estimate });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "estimate failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
