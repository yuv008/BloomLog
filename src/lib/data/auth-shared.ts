const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isLocalUserId(userId: string): boolean {
  return userId.startsWith("guest_") || !UUID_RE.test(userId);
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Whether calendar/daily data should persist to Supabase for this user. */
export function shouldUseSupabase(
  userId: string,
  opts?: { forceLocal?: boolean }
): boolean {
  if (opts?.forceLocal || isLocalUserId(userId)) return false;
  if (typeof window === "undefined") {
    return isSupabaseConfigured();
  }
  return isSupabaseConfigured();
}
