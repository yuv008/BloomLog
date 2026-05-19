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

const AUTH_SOURCE_KEY = "bloomlog_auth_source";

export function isLocalUserId(userId: string): boolean {
  return userId.startsWith("guest_") || !UUID_RE.test(userId);
}

export function shouldUseSupabase(userId: string): boolean {
  if (!createClient() || isLocalUserId(userId)) return false;
  if (typeof window !== "undefined") {
    const source = sessionStorage.getItem(AUTH_SOURCE_KEY);
    if (source === "local") return false;
  }
  return true;
}

function persistAuthSource(source: AuthSource) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(AUTH_SOURCE_KEY, source);
  }
}

export async function ensureAuth(): Promise<AuthSession> {
  const supabase = createClient();
  if (!supabase) {
    const userId = getOrCreateGuestId();
    persistAuthSource("local");
    return { userId, source: "local" };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.is_anonymous) {
    persistAuthSource("supabase");
    return { userId: session.user.id, source: "supabase" };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (!error && data.user) {
    persistAuthSource("supabase");
    return { userId: data.user.id, source: "supabase" };
  }

  console.warn(
    "[bloomlog] anonymous sign-in failed:",
    error?.message ?? "no user returned"
  );
  await supabase.auth.signOut();
  const userId = getOrCreateGuestId();
  persistAuthSource("local");
  return { userId, source: "local" };
}
