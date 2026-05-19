import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

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
      kind: "soft_sleep",
      period_start: startStr,
      period_end: endStr,
      payload: {
        best_date: best.date,
        hours: Math.round(bestHours * 10) / 10,
        label: "your softest sleep week",
      },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
