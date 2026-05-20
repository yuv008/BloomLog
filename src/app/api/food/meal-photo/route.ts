import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "meal-photos";

/** Delete storage objects for a food log entry */
export async function DELETE(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;

  const body = (await req.json()) as { entryId?: string; thumbPath?: string; fullPath?: string };
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true });

  const paths: string[] = [];
  if (body.thumbPath?.startsWith(`${userId}/`)) paths.push(body.thumbPath);
  if (body.fullPath?.startsWith(`${userId}/`)) paths.push(body.fullPath);

  if (body.entryId && paths.length === 0) {
    const { data } = await admin
      .from("food_log_entries")
      .select("photo_thumb_path, photo_full_path")
      .eq("user_id", userId)
      .eq("id", body.entryId)
      .maybeSingle();
    if (data?.photo_thumb_path) paths.push(data.photo_thumb_path as string);
    if (data?.photo_full_path) paths.push(data.photo_full_path as string);
  }

  if (paths.length) await admin.storage.from(BUCKET).remove(paths);
  return NextResponse.json({ ok: true });
}
