import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function dateInTimeZone(date: Date, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function last7DayKeys(timeZone: string): { start: string; end: string } {
  const end = dateInTimeZone(new Date(), timeZone);
  const keys: string[] = [end];
  for (let i = 1; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.unshift(dateInTimeZone(d, timeZone));
  }
  return { start: keys[0], end: keys[keys.length - 1] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { user_id } = await req.json();
  if (!user_id) {
    return new Response(JSON.stringify({ error: "user_id required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("timezone")
    .eq("id", user_id)
    .maybeSingle();
  const timeZone = (profile?.timezone as string) || "UTC";
  const { start: startStr, end: endStr } = last7DayKeys(timeZone);

  const { data: entries } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", user_id)
    .gte("date", startStr)
    .lte("date", endStr);

  const cozyMoods = ["cozy", "golden_hour", "dreamy"];
  const cozyCount =
    entries?.filter((e) => e.mood && cozyMoods.includes(e.mood)).length ?? 0;

  if (cozyCount >= 3) {
    await supabase.from("memory_polaroids").insert({
      user_id,
      kind: "cozy_week",
      period_start: startStr,
      period_end: endStr,
      payload: { cozy_days: cozyCount, label: "your coziest week" },
    });
  }

  const sleepEntries = entries?.filter((e) => e.sleep_start && e.sleep_end) ?? [];
  if (sleepEntries.length >= 3) {
    let best = sleepEntries[0];
    let bestHours = 0;
    for (const e of sleepEntries) {
      const hours =
        (new Date(e.sleep_end).getTime() - new Date(e.sleep_start).getTime()) /
        3600000;
      if (hours > bestHours) {
        bestHours = hours;
        best = e;
      }
    }
    await supabase.from("memory_polaroids").insert({
      user_id,
      kind: "rested_night",
      period_start: startStr,
      period_end: endStr,
      payload: {
        date: best.date,
        hours: Math.round(bestHours * 10) / 10,
        label: "your most rested night",
      },
    });
  }

  return new Response(JSON.stringify({ ok: true, start: startStr, end: endStr }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
