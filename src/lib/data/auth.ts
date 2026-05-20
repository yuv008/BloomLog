"use client";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateGuestId } from "@/lib/storage/local";
import {
  isLocalUserId,
  shouldUseSupabase as shouldUseSupabaseBase,
} from "@/lib/data/auth-shared";

export type AuthSource = "supabase" | "local";

export interface AuthSession {
  userId: string;
  source: AuthSource;
}

export { isLocalUserId } from "@/lib/data/auth-shared";

const AUTH_SOURCE_KEY = "bloomlog_auth_source";

export function shouldUseSupabase(userId: string): boolean {
  if (!createClient() || isLocalUserId(userId)) return false;
  if (typeof window !== "undefined") {
    const source = sessionStorage.getItem(AUTH_SOURCE_KEY);
    if (source === "local") return false;
  }
  return shouldUseSupabaseBase(userId);
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
