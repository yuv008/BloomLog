import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import { getCalendarAgenda } from "@/lib/data/calendar-server";
import { isRitualDateKey, todayKey } from "@/lib/dates";
import { DEFAULT_TIMEZONE } from "@/lib/locale/timezones";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

export async function GET(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;
  const dateParam = new URL(req.url).searchParams.get("date");
  let date: string | undefined;
  if (dateParam && isRitualDateKey(dateParam)) {
    date = dateParam;
  } else {
    const supabase = await createClient();
    if (supabase) {
      const { data: profileRow } = await supabase
        .from("users_profile")
        .select("timezone")
        .eq("id", userId)
        .maybeSingle();
      const tz =
        (profileRow as Pick<UserProfile, "timezone"> | null)?.timezone ??
        DEFAULT_TIMEZONE;
      date = todayKey(tz);
    }
  }
  const items = await getCalendarAgenda(userId, date);
  return NextResponse.json({ items });
}
