import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import { completeCalendarEvent } from "@/lib/data/calendar-server";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { date?: string };
  try {
    const result = await completeCalendarEvent(userId, id, body.date);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
