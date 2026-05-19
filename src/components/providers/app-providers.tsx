"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { MotionProvider } from "@/components/motion/motion-provider";
import { UserPreferencesProvider } from "@/components/providers/user-preferences";
import { initPostHog, trackEvent } from "@/lib/analytics/posthog";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
    trackEvent("app_opened");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <MotionProvider>
          <UserPreferencesProvider>{children}</UserPreferencesProvider>
        </MotionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
