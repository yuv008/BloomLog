import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : `/${next}`}`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.warn("[bloomlog] exchangeCodeForSession:", error.message);
  }

  const dest = next.startsWith("/") ? next : `/${next}`;
  return NextResponse.redirect(`${origin}${dest}`);
}
