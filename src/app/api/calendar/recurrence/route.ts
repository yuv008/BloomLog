import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import { createRecurrenceRule } from "@/lib/data/calendar-server";

export async function POST(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const body = (await req.json()) as {
    frequency: "daily" | "weekly" | "monthly";
    starts_on: string;
    ends_on?: string | null;
    by_weekday?: number[];
    interval_count?: number;
    template: Record<string, unknown>;
    through?: string;
  };
  if (!body.starts_on || !body.frequency || !body.template) {
    return NextResponse.json({ error: "invalid rule" }, { status: 400 });
  }
  const result = await createRecurrenceRule(userId, body);
  return NextResponse.json(result);
}
