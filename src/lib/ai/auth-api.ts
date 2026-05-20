import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function getApiUserId(): Promise<string | NextResponse> {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user.id;
}
