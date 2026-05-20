import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import {
  getRoutineTemplates,
  createRoutineTemplate,
  spawnRoutineForDate,
} from "@/lib/data/calendar-server";

export async function GET() {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const routines = await getRoutineTemplates(userId);
  return NextResponse.json({ routines });
}

export async function POST(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const body = (await req.json()) as {
    title?: string;
    category?: string;
    emoji?: string;
    spawn_date?: string;
    template_id?: string;
  };
  if (body.template_id && body.spawn_date) {
    const event = await spawnRoutineForDate(
      userId,
      body.template_id,
      body.spawn_date
    );
    return NextResponse.json({ event });
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const routine = await createRoutineTemplate(userId, {
    title: body.title,
    category: body.category as never,
    emoji: body.emoji,
  });
  return NextResponse.json({ routine });
}
