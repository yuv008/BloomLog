import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import {
  getCalendarEventById,
  updateCalendarEvent,
  archiveCalendarEvent,
  type UpdateCalendarEventInput,
} from "@/lib/data/calendar-server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const { id } = await params;
  const event = await getCalendarEventById(userId, id);
  if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const { id } = await params;
  const body = (await req.json()) as UpdateCalendarEventInput;
  try {
    const event = await updateCalendarEvent(userId, id, body);
    if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ event });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const { id } = await params;
  await archiveCalendarEvent(userId, id);
  return NextResponse.json({ ok: true });
}
