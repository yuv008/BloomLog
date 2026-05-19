"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { timeGreeting } from "@/lib/dates";
import { useUserPreferences } from "@/components/providers/user-preferences";

export function GreetingHeader({ name }: { name?: string | null }) {
  const { timezone } = useUserPreferences();

  return (
    <header className="flex items-start justify-between gap-2 px-1 py-2 min-w-0">
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl text-ink capitalize">
          {timeGreeting(name, timezone)}
        </p>
        <p className="text-sm text-whisper mt-0.5">a quiet minute for today</p>
      </div>
      <Link
        href="/settings"
        className="shrink-0 rounded-full p-2 text-whisper hover:bg-beige/40 transition-colors"
        aria-label="settings"
      >
        <Settings className="h-5 w-5" strokeWidth={1.5} />
      </Link>
    </header>
  );
}
