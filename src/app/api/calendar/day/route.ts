import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/ai/auth-api";
import { getCalendarDay } from "@/lib/data/calendar-server";
import { buildWellnessTimeline } from "@/lib/calendar/merge-wellness";
import { DEFAULT_TIMEZONE } from "@/lib/locale/timezones";
import { createClient } from "@/lib/supabase/server";
import { todayKey, isRitualDateKey } from "@/lib/dates";
import type { DailyEntry, FoodLogEntry, UserProfile } from "@/lib/types";

export async function GET(req: Request) {
  const userId = await getApiUserId();
  if (userId instanceof NextResponse) return userId;

  const dateParam = new URL(req.url).searchParams.get("date");
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: profileRow } = await supabase
    .from("users_profile")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const profile = profileRow as UserProfile | null;
  const tz = profile?.timezone ?? DEFAULT_TIMEZONE;
  const date =
    dateParam && isRitualDateKey(dateParam) ? dateParam : todayKey(tz);

  const [events, dailyRes, foodRes] = await Promise.all([
    getCalendarDay(userId, date),
    supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle(),
    supabase
      .from("food_log_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("logged_at", { ascending: true }),
  ]);

  const daily = (dailyRes.data as DailyEntry | null) ?? null;
  const foodLog = (foodRes.data as FoodLogEntry[]) ?? [];

  const wellness = buildWellnessTimeline(
    daily,
    foodLog,
    tz,
    profile?.water_goal_ml ?? 2000
  );

  return NextResponse.json({
    events,
    wellness,
    mood: daily?.mood ?? null,
  });
}
