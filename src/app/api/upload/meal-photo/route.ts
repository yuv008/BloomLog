import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayKey } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { FoodTag, MealSlot, FoodLogSource } from "@/lib/types";

const BUCKET = "meal-photos";

export async function POST(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const form = await req.formData();
  const thumb = form.get("thumb");
  const full = form.get("full");
  if (!(thumb instanceof Blob) || !(full instanceof Blob)) {
    return NextResponse.json({ error: "thumb and full required" }, { status: 400 });
  }

  const meal_slot = (form.get("meal_slot") as MealSlot) ?? "snack";
  const name = (form.get("name") as string) || "polaroid meal";
  const dateField = form.get("date") as string | null;
  const source = (form.get("source") as FoodLogSource) || "polaroid";
  const entryId = (form.get("entry_id") as string) || crypto.randomUUID();
  const tagsRaw = form.get("emotional_tags");
  let emotional_tags: FoodTag[] = [];
  if (typeof tagsRaw === "string") {
    try {
      emotional_tags = JSON.parse(tagsRaw) as FoodTag[];
    } catch {
      emotional_tags = [];
    }
  }

  const supabase = await createClient();
  let ritualDate = dateField ?? todayKey();
  if (supabase) {
    const { data: profile } = await supabase
      .from("users_profile")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    if (!dateField) ritualDate = todayKey(profile?.timezone as string | undefined);
  }

  const thumbPath = `${userId}/${ritualDate}/${entryId}_thumb.webp`;
  const fullPath = `${userId}/${ritualDate}/${entryId}_full.webp`;
  const photoBytes = thumb.size + full.size;

  const uploadThumb = await admin.storage.from(BUCKET).upload(thumbPath, thumb, {
    contentType: "image/webp",
    upsert: true,
  });
  if (uploadThumb.error) {
    return NextResponse.json({ error: uploadThumb.error.message }, { status: 500 });
  }

  const uploadFull = await admin.storage.from(BUCKET).upload(fullPath, full, {
    contentType: "image/webp",
    upsert: true,
  });
  if (uploadFull.error) {
    await admin.storage.from(BUCKET).remove([thumbPath]);
    return NextResponse.json({ error: uploadFull.error.message }, { status: 500 });
  }

  const entry = {
    id: entryId,
    user_id: userId,
    date: ritualDate,
    logged_at: new Date().toISOString(),
    meal_slot,
    name,
    photo_url: thumbPath,
    photo_thumb_path: thumbPath,
    photo_full_path: fullPath,
    photo_bytes: photoBytes,
    emotional_tags,
    calories: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
    fiber_g: null,
    journal_note: null,
    source,
    source_meta: { photo_thumb_path: thumbPath, photo_full_path: fullPath },
    created_at: new Date().toISOString(),
  };

  const { error: insertError } = await admin.from("food_log_entries").insert(entry);
  if (insertError) {
    await admin.storage.from(BUCKET).remove([thumbPath, fullPath]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: signed } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(thumbPath, 3600);

  return NextResponse.json({
    entry: {
      ...entry,
      photo_url: signed?.signedUrl ?? thumbPath,
      source_meta: entry.source_meta,
    },
    thumbUrl: signed?.signedUrl ?? null,
  });
}
