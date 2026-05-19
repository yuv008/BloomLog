"use client";

const ALLOWED_EVENTS = [
  "daily_checkin_complete",
  "mood_set",
  "water_added",
  "quest_completed",
  "expense_logged",
  "meal_logged",
  "onboarding_complete",
  "app_opened",
  "journal_written",
] as const;

export type AllowedEvent = (typeof ALLOWED_EVENTS)[number];

let initialized = false;

export async function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const { default: posthog } = await import("posthog-js");
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    autocapture: false,
    capture_pageview: true,
    persistence: "localStorage",
  });
  initialized = true;
}

export function trackEvent(
  event: AllowedEvent,
  properties?: Record<string, string | number | boolean>
) {
  if (!ALLOWED_EVENTS.includes(event)) return;
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  import("posthog-js").then(({ default: posthog }) => {
    posthog.capture(event, properties);
  });
}
