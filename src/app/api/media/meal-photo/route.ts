import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "meal-photos";

export async function GET(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;

  const path = new URL(req.url).searchParams.get("path");
  if (!path || !path.startsWith(`${userId}/`)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
