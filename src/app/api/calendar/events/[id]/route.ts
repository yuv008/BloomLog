import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import {
  updateCalendarEvent,
  archiveCalendarEvent,
  type UpdateCalendarEventInput,
} from "@/lib/data/calendar-server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const { id } = await params;
  const body = (await req.json()) as UpdateCalendarEventInput;
  const event = await updateCalendarEvent(userId, id, body);
  if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ event });
}

export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const { id } = await params;
  await archiveCalendarEvent(userId, id);
  return NextResponse.json({ ok: true });
}
