import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import {
  getCalendarEventsRange,
  createCalendarEvent,
  type CreateCalendarEventInput,
} from "@/lib/data/calendar-server";

export async function GET(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from and to required" }, { status: 400 });
  }
  const events = await getCalendarEventsRange(userId, from, to);
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const body = (await req.json()) as CreateCalendarEventInput;
  if (!body.ritual_date || !body.title?.trim()) {
    return NextResponse.json({ error: "ritual_date and title required" }, { status: 400 });
  }
  try {
    const event = await createCalendarEvent(userId, body);
    return NextResponse.json({ event });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
