import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await req.json();
  const { user_id, whisper_key } = body;

  if (!user_id || !whisper_key) {
    return new Response(JSON.stringify({ error: "missing fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("whispers_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id)
    .gte("shown_at", `${today}T00:00:00`);

  if ((count ?? 0) >= 1) {
    return new Response(JSON.stringify({ allowed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabase.from("whispers_log").insert({ user_id, whisper_key });

  return new Response(JSON.stringify({ allowed: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
