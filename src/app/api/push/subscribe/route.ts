import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  // Store subscription in Supabase when configured
  return NextResponse.json({ ok: true, received: !!body.endpoint });
}
