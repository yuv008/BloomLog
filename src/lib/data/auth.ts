"use client";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateGuestId } from "@/lib/storage/local";

export type AuthSource = "supabase" | "local";

export interface AuthSession {
  userId: string;
  source: AuthSource;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isLocalUserId(userId: string): boolean {
  return userId.startsWith("guest_") || !UUID_RE.test(userId);
}

export function shouldUseSupabase(userId: string): boolean {
  return Boolean(createClient()) && !isLocalUserId(userId);
}

export async function ensureAuth(): Promise<AuthSession> {
  const supabase = createClient();
  if (!supabase) {
    return { userId: getOrCreateGuestId(), source: "local" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { userId: user.id, source: "supabase" };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn("[bloomlog] anonymous sign-in failed:", error.message);
    return { userId: getOrCreateGuestId(), source: "local" };
  }

  if (data.user) {
    return { userId: data.user.id, source: "supabase" };
  }

  return { userId: getOrCreateGuestId(), source: "local" };
}
